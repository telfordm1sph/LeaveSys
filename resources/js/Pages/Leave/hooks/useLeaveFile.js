import { useMemo } from "react";
import { useForm } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { countWorkingDays, isLateFiling, APPEAL_TYPES, ATTACHMENT_TYPES } from "@/lib/leaveUtils";

export function useLeaveFile(balances, holidaySet) {
    const { emp_data } = usePage().props;

    // Weekends are only rest days for shift_type=1 AND team=1 (day shift, standard team).
    // Other shifts/teams may work on weekends — those days count as working days.
    const skipWeekends = emp_data?.shift_type == 1 && emp_data?.team == 1;

    const { data, setData, post, processing, errors, reset } = useForm({
        leave_type:       "",
        date_start:       "",
        date_end:         "",
        duration:         "whole",  // 'whole' | 'half'
        hours_per_day:    "8",      // 8 | 10 | 12 — only applies when duration = 'whole'
        reason:           "",
        appeal_reason:    "",
        appeal_files:     [],
        attachment_files: [],
    });

    const selected  = useMemo(
        () => balances.find((b) => b.leave_type === data.leave_type) ?? null,
        [balances, data.leave_type],
    );

    const wDays = useMemo(
        () => countWorkingDays(data.date_start, data.date_end, holidaySet, skipWeekends),
        [data.date_start, data.date_end, holidaySet, skipWeekends],
    );

    const hrsPerDay  = parseInt(data.hours_per_day, 10) || 8;
    const minsPerDay = data.duration === "half" ? (hrsPerDay / 2) * 60 : hrsPerDay * 60;
    const dedMin     = wDays * minsPerDay;
    const late       = isLateFiling(data.leave_type, data.date_start);
    const needAppeal = late && APPEAL_TYPES.includes(data.leave_type);
    const needAttach = ATTACHMENT_TYPES.includes(data.leave_type);

    const curMin    = parseInt(selected?.balance_minutes, 10) || 0;
    const paidMin   = Math.min(dedMin, curMin);
    const unpaidMin = dedMin - paidMin;
    const remMin    = curMin - paidMin;

    const ready =
        !!data.leave_type &&
        !!data.date_start &&
        !!data.date_end &&
        wDays > 0 &&
        data.reason.trim().length > 0 &&
        (!needAppeal || data.appeal_reason.trim().length > 0) &&
        !processing;

    function submit(e) {
        e.preventDefault();
        post(route("leave.file.store"), { forceFormData: true });
    }

    return {
        data, setData, processing, errors, reset,
        selected, wDays, minsPerDay, dedMin, needAppeal, needAttach,
        unpaidMin, remMin, ready, submit,
    };
}
