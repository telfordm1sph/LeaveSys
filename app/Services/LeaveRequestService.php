<?php

namespace App\Services;

use App\Models\LeaveApprover;
use App\Models\LeaveRequest;
use App\Repositories\LeaveFilingRepository;
use Illuminate\Support\Facades\DB;

class LeaveRequestService
{
    public function __construct(
        protected LeaveFilingRepository $repo,
        protected HrisApiService $hris,
    ) {}

    // ─── Employee: my requests ────────────────────────────────────────────────

    public function getMyRequests(int $employid, string $tab = 'pending', string $search = '', int $page = 1, bool $withAppeal = false): array
    {
        $statuses = $tab === 'pending'
            ? ['pending', 'partially_approved']
            : ['approved', 'rejected', 'cancelled'];

        $paginator = LeaveRequest::where('employid', $employid)
            ->whereIn('status', $statuses)
            ->where('with_appeal', $withAppeal ? 1 : 0)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('leave_type', 'like', "%{$search}%")
                       ->orWhere('reason', 'like', "%{$search}%");
                });
            })
            ->with(['approvers' => fn($q) => $q->orderBy('approver_level')])
            ->orderByDesc('date_start')
            ->paginate(15, ['*'], 'page', $page);

        // Batch-resolve approver names for all rows in this page
        $approverIds = collect($paginator->items())
            ->flatMap(fn($r) => $r->approvers->pluck('approver_employid'))
            ->unique()->all();
        $names = $this->resolveNames($approverIds);

        $items = collect($paginator->items())->map(fn($r) => array_merge($r->toArray(), [
            'approvers' => $r->approvers->map(fn($a) => array_merge($a->toArray(), [
                'approver_name' => $names[$a->approver_employid] ?? "#{$a->approver_employid}",
            ]))->toArray(),
        ]))->toArray();

        return [
            'data'         => $items,
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'total'        => $paginator->total(),
            'per_page'     => $paginator->perPage(),
        ];
    }

    // ─── Approver: pending for me ─────────────────────────────────────────────

    public function getPendingApprovals(int $approverId, bool $withAppeal = false): array
    {
        $records = LeaveApprover::where('approver_employid', $approverId)
            ->where('status', 'pending')
            ->with(['leaveRequest.approvers' => fn($q) => $q->orderBy('approver_level')])
            ->get()
            ->filter(fn($ar) => $ar->leaveRequest && (bool) $ar->leaveRequest->with_appeal === $withAppeal);

        // Only show when all lower-level approvers have already approved
        $filtered = $records->filter(function ($ar) {
            if (!$ar->leaveRequest) return false;
            return $ar->leaveRequest->approvers
                ->filter(fn($a) => $a->approver_level < $ar->approver_level)
                ->every(fn($a) => $a->status === 'approved');
        });

        // Resolve filer names
        $employeeIds = $filtered->pluck('leaveRequest.employid')->unique()->all();
        $names       = $this->resolveNames($employeeIds);

        return $filtered->map(fn($ar) => array_merge($ar->leaveRequest->toArray(), [
            'employee_name'     => $names[$ar->leaveRequest->employid] ?? "#{$ar->leaveRequest->employid}",
            'my_approver_level' => $ar->approver_level,
            'approvers'         => $ar->leaveRequest->approvers
                ->map(fn($a) => $a->toArray())->toArray(),
        ]))->values()->toArray();
    }

    // ─── Approver: history (already actioned) ────────────────────────────────

    public function getStaffHistory(int $approverId, bool $withAppeal, int $page = 1): array
    {
        $perPage = 15;

        $all = LeaveApprover::where('approver_employid', $approverId)
            ->whereIn('status', ['approved', 'rejected'])
            ->with(['leaveRequest.approvers' => fn($q) => $q->orderBy('approver_level')])
            ->get()
            ->filter(fn($ar) => $ar->leaveRequest && (bool) $ar->leaveRequest->with_appeal === $withAppeal)
            ->sortByDesc('decided_at')
            ->values();

        $total = $all->count();
        $items = $all->slice(($page - 1) * $perPage, $perPage)->values();

        $employeeIds = $items->pluck('leaveRequest.employid')->unique()->all();
        $names       = $this->resolveNames($employeeIds);

        return [
            'data'         => $items->map(fn($ar) => array_merge($ar->leaveRequest->toArray(), [
                'employee_name'     => $names[$ar->leaveRequest->employid] ?? "#{$ar->leaveRequest->employid}",
                'my_approver_level' => $ar->approver_level,
                'my_status'         => $ar->status,
                'my_remarks'        => $ar->remarks,
                'my_decided_at'     => $ar->decided_at,
                'approvers'         => $ar->leaveRequest->approvers->map(fn($a) => $a->toArray())->toArray(),
            ]))->toArray(),
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $perPage)),
            'total'        => $total,
            'per_page'     => $perPage,
        ];
    }

    // ─── Approve ──────────────────────────────────────────────────────────────

    public function approve(int $approverId, int $requestId, ?string $remarks): array
    {
        $approver = LeaveApprover::where('leave_request_id', $requestId)
            ->where('approver_employid', $approverId)
            ->where('status', 'pending')
            ->first();

        if (!$approver) {
            return ['status' => 'error', 'message' => 'Not authorized or already actioned.'];
        }

        $hasPendingLower = LeaveApprover::where('leave_request_id', $requestId)
            ->where('approver_level', '<', $approver->approver_level)
            ->where('status', '!=', 'approved')
            ->exists();

        if ($hasPendingLower) {
            return ['status' => 'error', 'message' => 'A lower-level approver has not yet approved.'];
        }

        DB::transaction(function () use ($approver, $requestId, $remarks) {
            $approver->update([
                'status'     => 'approved',
                'remarks'    => $remarks,
                'decided_at' => now(),
            ]);

            $hasMorePending = LeaveApprover::where('leave_request_id', $requestId)
                ->where('status', 'pending')
                ->exists();

            LeaveRequest::where('id', $requestId)->update([
                'status' => $hasMorePending ? 'partially_approved' : 'approved',
            ]);
        });

        return ['status' => 'ok'];
    }

    // ─── Reject ───────────────────────────────────────────────────────────────

    public function reject(int $approverId, int $requestId, string $remarks): array
    {
        $approver = LeaveApprover::where('leave_request_id', $requestId)
            ->where('approver_employid', $approverId)
            ->where('status', 'pending')
            ->first();

        if (!$approver) {
            return ['status' => 'error', 'message' => 'Not authorized or already actioned.'];
        }

        DB::transaction(function () use ($approver, $requestId, $remarks) {
            $approver->update([
                'status'     => 'rejected',
                'remarks'    => $remarks,
                'decided_at' => now(),
            ]);

            $request = LeaveRequest::findOrFail($requestId);
            $request->status = 'rejected';
            $request->save();

            $this->repo->refundBalance($request);
        });

        return ['status' => 'ok'];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Resolve emp names from HRIS for a list of IDs. Returns [id => name]. */
    private function resolveNames(array $ids): array
    {
        $names = [];
        foreach (array_unique($ids) as $id) {
            $names[$id] = $this->hris->fetchEmployeeName($id) ?? "#{$id}";
        }
        return $names;
    }
}
