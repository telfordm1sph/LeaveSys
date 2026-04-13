<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HrisApiService
{
    private string $baseUrl;
    private string $key;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.hris.url'), '/');
        $this->key     = config('services.hris.key');
    }

    /**
     * Fetch the full name of an employee from the HRIS API.
     * Returns null if the employee is not found or the request fails.
     */
    public function fetchEmployeeName(int $employid): ?string
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Key' => $this->key,
            ])->get("{$this->baseUrl}/api/employees/{$employid}");

            if ($response->failed()) {
                return null;
            }

            return $response->json('data.emp_name') ?? null;
        } catch (\Exception $e) {
            Log::error("HRIS fetchEmployeeName exception: {$e->getMessage()}", ['employid' => $employid]);
            return null;
        }
    }

    /**
     * Fetch work details for a single employee.
     *
     * Actual HRIS API response (GET /api/employees/{id}/work → data):
     *   accstatus        1|2            1=active, 2=separated
     *   emp_status_id    0|1            0=probationary, 1=regular
     *   emp_prodline_id  int            production line numeric ID
     *   emp_prodline     string         production line name e.g. "PL8"
     *   shift_type_id    int            shift type numeric ID
     *   team_id          int            team numeric ID
     *   date_hired       YYYY-MM-DD
     *   date_reg         YYYY-MM-DD
     *
     * Returns a normalized array with internal field names used throughout
     * LeaveAutoUpdateService so field-name changes stay isolated here:
     *   acc_status, emp_status, prod_line, date_hired, date_reg, shift_type, team
     */
    public function fetchWorkDetails(int $employid): ?array
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Key' => $this->key,
            ])->get("{$this->baseUrl}/api/employees/{$employid}/work");

            if ($response->failed()) {
                Log::warning('HRIS fetchWorkDetails failed', [
                    'employid' => $employid,
                    'status'   => $response->status(),
                ]);
                return null;
            }

            $raw = $response->json('data');

            if (!$raw) {
                return null;
            }

            // Guard against API returning arrays where scalars are expected
            $arrayFields = array_filter([
                'accstatus'     => $raw['accstatus']      ?? null,
                'emp_status_id' => $raw['emp_status_id']  ?? null,
                'date_hired'    => $raw['date_hired']     ?? null,
                'date_reg'      => $raw['date_reg']       ?? null,
            ], 'is_array');

            if (!empty($arrayFields)) {
                Log::warning('HRIS fetchWorkDetails: unexpected array values in response', [
                    'employid'      => $employid,
                    'array_fields'  => array_keys($arrayFields),
                    'raw_data'      => $raw,
                ]);
                return null;
            }

            // Normalize API field names → internal names
            return [
                'acc_status'  => $raw['accstatus']       ?? null,  // 1=active, 2=separated
                'emp_status'  => $raw['emp_status_id']   ?? null,  // 0=probationary, 1=regular
                'date_hired'  => $raw['date_hired']      ?? null,
                'date_reg'    => $raw['date_reg']        ?? null,
                'prod_line'   => $raw['emp_prodline']    ?? null,  // name string e.g. "PL8"
                'shift_type'  => $raw['shift_type_id']  ?? null,  // numeric shift type
                'team'        => $raw['team_id']         ?? null,  // numeric team
            ];
        } catch (\Exception $e) {
            Log::error("HRIS fetchWorkDetails exception: {$e->getMessage()}", ['employid' => $employid]);
            return null;
        }
    }

    /**
     * Fetch a paginated/filtered list of active employees for UI comboboxes.
     * Passes search + pagination params to HRIS (if supported); falls back
     * to returning an empty list on failure.
     *
     * Returns:
     *   data    — array of rows, each with emp_id + emp_name (at minimum)
     *   hasMore — true when another page is available
     */
    public function fetchActiveEmployees(string $search = '', int $page = 1, int $perPage = 20): array
    {
        try {
            $q = base64_encode(json_encode([
                'search'   => $search,
                'page'     => $page,
                'per_page' => $perPage,
            ]));

            $response = Http::withHeaders([
                'X-Internal-Key' => $this->key,
            ])->get("{$this->baseUrl}/api/employees/active", ['q' => $q]);

            if ($response->failed()) {
                Log::warning('HRIS fetchActiveEmployees failed', [
                    'status' => $response->status(),
                ]);
                return ['data' => [], 'hasMore' => false];
            }

            $json        = $response->json();
            $list        = $json['data']         ?? [];
            $currentPage = (int) ($json['current_page'] ?? $page);
            $lastPage    = (int) ($json['last_page']    ?? 1);

            return [
                'data'    => is_array($list) ? $list : [],
                'hasMore' => $currentPage < $lastPage,
            ];
        } catch (\Exception $e) {
            Log::error("HRIS fetchActiveEmployees exception: {$e->getMessage()}");
            return ['data' => [], 'hasMore' => false];
        }
    }

    /**
     * Check if work data is usable — skip employees with missing/invalid dates.
     * Expects the normalized array returned by fetchWorkDetails().
     */
    public function isValidWorkData(?array $work): bool
    {
        if (!$work) return false;

        $required = ['emp_status', 'acc_status', 'date_hired', 'date_reg'];
        foreach ($required as $field) {
            if (is_null($work[$field]) || $work[$field] === '' || is_array($work[$field])) return false;
        }

        $invalidDates = ['0000-00-00', '1970-01-01'];
        foreach (['date_hired', 'date_reg'] as $field) {
            if (in_array($work[$field], $invalidDates)) return false;
        }

        return true;
    }
}
