<?php

namespace App\Services;

use App\Models\AppealFile;
use App\Models\AttachmentFile;
use App\Repositories\LeaveFilingRepository;
use App\Services\HrisApiService;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LeaveFilingService
{
    private const REQUIRES_APPEAL_IF_LATE = ['VL'];
    private const REQUIRES_ATTACHMENT     = ['EL', 'BRL'];
    private const VL_ADVANCE_DAYS         = 2;
    private const AUTO_APPROVE_POSITION   = 5;
    private const HR_VERIFICATION_TYPES   = ['MATERNITY'];

    public function __construct(
        protected LeaveFilingRepository $repo,
        protected HrisApiService $hris,
    ) {}

    // ─── Form data ────────────────────────────────────────────────────────────

    public function getFormData(int $employid): array
    {
        return [
            'balances' => $this->repo->getBalances($employid)->map(fn($b) => [
                'leave_type'      => $b->leave_type,
                'label'           => $b->label,
                'earn_type'       => $b->earn_type,
                'balance_minutes' => (int) $b->balance_minutes,
            ])->values(),
            'holidays' => $this->repo->getUpcomingHolidays()->map(fn($h) => [
                'date' => $h->holiday_date,
                'name' => $h->name,
                'type' => $h->type,
            ])->values(),
        ];
    }

    // ─── Working days ─────────────────────────────────────────────────────────

    public function computeWorkingDays(string $dateStart, string $dateEnd): int
    {
        $start    = Carbon::parse($dateStart)->startOfDay();
        $end      = Carbon::parse($dateEnd)->startOfDay();
        $holidays = $this->repo->getHolidaysInRange($start, $end);

        $count   = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            if (!$current->isWeekend() && !$holidays->contains($current->toDateString())) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }

    // ─── Late filing ──────────────────────────────────────────────────────────

    public function isLateFiling(string $leaveType, string $dateStart): bool
    {
        if (strtoupper($leaveType) !== 'VL') {
            return false;
        }

        $diffDays = Carbon::today()->diffInDays(Carbon::parse($dateStart), false);
        return $diffDays < self::VL_ADVANCE_DAYS;
    }

    // ─── Requirements ─────────────────────────────────────────────────────────

    public function getFilingRequirements(string $leaveType, bool $isLate): array
    {
        $type = strtoupper($leaveType);

        return [
            'require_appeal'     => $isLate && in_array($type, self::REQUIRES_APPEAL_IF_LATE),
            'require_attachment' => in_array($type, self::REQUIRES_ATTACHMENT),
        ];
    }

    // ─── Status resolution ────────────────────────────────────────────────────

    public function resolveLeaveStatus(int $positionId, string $leaveType): string
    {
        return $positionId === self::AUTO_APPROVE_POSITION ? 'approved' : 'pending';
    }

    // ─── Approver chain ───────────────────────────────────────────────────────

    private function createApprovers(int $requestId, int $employid, bool $isAppeal): void
    {
        try {
            if ($isAppeal) {
                // Appeal chain: 2nd approver (L1) → Operation Director (L2)
                $approvers = $this->hris->fetchApprovers($employid);
                if ($approvers && $approvers['approver2_id']) {
                    $this->repo->createApprover([
                        'leave_request_id'  => $requestId,
                        'approver_employid' => $approvers['approver2_id'],
                        'approver_level'    => 1,
                        'status'            => 'pending',
                    ]);
                }
                $od = $this->hris->fetchOperationDirector();
                if ($od) {
                    $this->repo->createApprover([
                        'leave_request_id'  => $requestId,
                        'approver_employid' => $od['emp_id'],
                        'approver_level'    => 2,
                        'status'            => 'pending',
                    ]);
                }
            } else {
                // Normal chain: 1st approver (L1) → 2nd approver (L2, if exists)
                $approvers = $this->hris->fetchApprovers($employid);
                if (!$approvers || !$approvers['approver1_id']) {
                    Log::warning('LeaveFilingService: no approver data for employee', [
                        'leave_request_id' => $requestId,
                        'employid'         => $employid,
                    ]);
                    return;
                }
                $this->repo->createApprover([
                    'leave_request_id'  => $requestId,
                    'approver_employid' => $approvers['approver1_id'],
                    'approver_level'    => 1,
                    'status'            => 'pending',
                ]);
                if ($approvers['approver2_id']) {
                    $this->repo->createApprover([
                        'leave_request_id'  => $requestId,
                        'approver_employid' => $approvers['approver2_id'],
                        'approver_level'    => 2,
                        'status'            => 'pending',
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error("LeaveFilingService createApprovers exception: {$e->getMessage()}", [
                'leave_request_id' => $requestId,
            ]);
        }
    }

    // ─── File storage ─────────────────────────────────────────────────────────

    private function saveAppealFiles(array $files, int|string $leaveId, int $employid, ?string $reason): void
    {
        $folder = "leave-attachments/{$employid}/appeals";
        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) continue;
            $storedPath = $file->store($folder, 'public');
            AppealFile::create([
                'leave_id'           => (string) $leaveId,
                'employid'           => (string) $employid,
                'original_file_name' => $file->getClientOriginalName(),
                'file_location'      => $folder,
                'file_name'          => basename($storedPath),
                'file_type'          => $file->getMimeType(),
                'file_size'          => $file->getSize(),
                'date_filed'         => now(),
                'reason'             => $reason,
            ]);
        }
    }

    private function saveAttachmentFiles(array $files, int|string $leaveId, int $employid): void
    {
        $folder = "leave-attachments/{$employid}/attachments";
        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) continue;
            $storedPath = $file->store($folder, 'public');
            AttachmentFile::create([
                'leave_id'           => (string) $leaveId,
                'employid'           => (string) $employid,
                'original_file_name' => $file->getClientOriginalName(),
                'file_location'      => $folder,
                'file_name'          => basename($storedPath),
                'file_type'          => $file->getMimeType(),
                'file_size'          => $file->getSize(),
                'date_filed'         => now(),
            ]);
        }
    }

    // ─── Core filing ─────────────────────────────────────────────────────────

    /**
     * File a leave request — everything handled in one call.
     * Appeal reason/files and attachment files are accepted here
     * and stored if present.
     */
    public function file(
        int   $employid,
        int   $positionId,
        array $data,
        array $appealFiles     = [],
        array $attachmentFiles = []
    ): array {
        $leaveType   = strtoupper($data['leave_type']);
        $dateStart   = $data['date_start'];
        $dateEnd     = $data['date_end'];
        $baseHours   = (int) ($data['hours_per_day'] ?? 8);
        $hoursPerDay = ($data['duration'] ?? 'whole') === 'half' ? $baseHours / 2 : $baseHours;
        $reason      = $data['reason'];
        $appealReason = $data['appeal_reason'] ?? null;
        $datePosted  = Carbon::today()->toDateString();

        // 1. Working days + deduction
        $workingDays      = $this->computeWorkingDays($dateStart, $dateEnd);
        $deductionMinutes = $workingDays * $hoursPerDay * 60;

        if ($workingDays === 0) {
            return ['status' => 'error', 'errors' => ['No working days in the selected date range.']];
        }

        // 2. Balance check
        $balance = $this->repo->getBalance($employid, $leaveType);

        if (!$balance) {
            return ['status' => 'error', 'errors' => ["No balance record found for {$leaveType}."]];
        }

        $paidMinutes   = min($deductionMinutes, $balance->balance_minutes);
        $unpaidMinutes = $deductionMinutes - $paidMinutes;

        // 3. Late + requirements
        $isLate       = $this->isLateFiling($leaveType, $dateStart);
        $requirements = $this->getFilingRequirements($leaveType, $isLate);

        // 4. Status + HR flag
        $status      = $this->resolveLeaveStatus($positionId, $leaveType);
        $adminRemark = in_array($leaveType, self::HR_VERIFICATION_TYPES)
            ? 'For HR Verification'
            : null;

        // 5. Create request + deduct balance in one transaction
        $duration     = ($data['duration'] ?? 'whole') === 'half' ? 'half day' : 'whole day';

        $leaveRequest = DB::transaction(function () use (
            $employid,
            $leaveType,
            $dateStart,
            $dateEnd,
            $hoursPerDay,
            $duration,
            $workingDays,
            $deductionMinutes,
            $reason,
            $status,
            $adminRemark,
            $datePosted,
            $isLate,
            $requirements,
            $balance,
            $paidMinutes,
            $unpaidMinutes
        ) {
            $request = $this->repo->createRequest([
                'employid'          => $employid,
                'leave_type'        => $leaveType,
                'date_start'        => $dateStart,
                'date_end'          => $dateEnd,
                'hours_per_day'     => $hoursPerDay,
                'working_days'      => $workingDays,
                'deduction_minutes' => $deductionMinutes,
                'paid_minutes'      => $paidMinutes,
                'unpaid_minutes'    => $unpaidMinutes,
                'reason'            => $reason,
                'status'            => $status,
                'admin_remarks'     => $adminRemark,
                'is_late_filing'    => $isLate ? 1 : 0,
                'with_appeal'       => $requirements['require_appeal'] ? 1 : 0,
                'appeal_status'     => $requirements['require_appeal'] ? 'pending' : 'none',
                'date_posted'       => $datePosted,
            ]);

            $this->repo->deductBalance(
                $balance,
                $paidMinutes,
                $request->id,
                "{$leaveType} leave filed — {$workingDays} working day(s), {$duration} ({$hoursPerDay}hrs/day)"
            );

            return $request;
        });

        // 6. Save appeal / attachment files to their own tables (non-blocking)
        if (!empty($appealFiles)) {
            $this->saveAppealFiles($appealFiles, $leaveRequest->id, $employid, $appealReason);
        }
        if (!empty($attachmentFiles)) {
            $this->saveAttachmentFiles($attachmentFiles, $leaveRequest->id, $employid);
        }

        // 7. Create approver chain (non-blocking — filing succeeds even if HRIS is down)
        if ($positionId !== self::AUTO_APPROVE_POSITION) {
            $this->createApprovers($leaveRequest->id, $employid, $requirements['require_appeal']);
        }

        return [
            'status'        => 'filed',
            'leave_request' => $leaveRequest->toArray(),
            'deduction'     => [
                'working_days'      => $workingDays,
                'hours_per_day'     => $hoursPerDay,
                'deduction_minutes' => $deductionMinutes,
                'paid_minutes'      => $paidMinutes,
                'unpaid_minutes'    => $unpaidMinutes,
            ],
            'is_late'       => $isLate,
            'errors'        => [],
        ];
    }
}
