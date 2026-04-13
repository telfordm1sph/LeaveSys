<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Services\LeaveFilingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveFilingController extends Controller
{
    public function __construct(
        protected LeaveFilingService $service
    ) {}

    public function index(): Response
    {
        $employid = (int) session('emp_data.emp_id');
        $formData = $this->service->getFormData($employid);

        return Inertia::render('Leave/File', $formData);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type'    => 'required|string|max:20',
            'date_start'    => 'required|date',
            'date_end'      => 'required|date|after_or_equal:date_start',
            'duration'      => 'required|in:whole,half',
            'hours_per_day' => 'required|integer|in:8,10,12',
            'reason'        => 'required|string|max:1000',
            // Appeal (VL late filing)
            'appeal_reason' => 'nullable|string|max:1000',
            'appeal_files'  => 'nullable|array',
            'appeal_files.*'=> 'file|max:10240|mimes:pdf,jpg,jpeg,png',
            // Attachment (EL, Bereavement)
            'attachment_files'   => 'nullable|array',
            'attachment_files.*' => 'file|max:10240|mimes:pdf,jpg,jpeg,png',
        ]);

        $employid   = (int) session('emp_data.emp_id');
        $positionId = (int) session('emp_data.emp_position_id');

        $appealFiles     = $request->file('appeal_files', []);
        $attachmentFiles = $request->file('attachment_files', []);

        $result = $this->service->file(
            $employid,
            $positionId,
            $validated,
            $appealFiles,
            $attachmentFiles
        );

        if ($result['status'] === 'error') {
            return back()
                ->withErrors(['filing' => $result['errors'][0]])
                ->withInput();
        }

        return redirect()
            ->route('leave.balances')
            ->with('success', 'Leave filed successfully.');
    }
}
