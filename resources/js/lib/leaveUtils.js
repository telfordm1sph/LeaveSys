// ─── Constants ────────────────────────────────────────────────────────────────

export const MINS_PER_DAY = 480;
export const VL_ADVANCE_DAYS = 2;
export const HOURS_OPTIONS = [8, 10, 12]; // kept for reference; UI uses DURATION_OPTIONS
export const DURATION_OPTIONS = [
    { value: "whole", label: "Whole Day",  hrs: 8,  mins: 480 },
    { value: "half",  label: "Half Day",   hrs: 4,  mins: 240 },
];
export const APPEAL_TYPES = ["VL"];
export const ATTACHMENT_TYPES = ["EL", "BEREAVEMENT"];

export const EARN_TYPE_LABEL = {
    monthly: "Monthly",
    yearly: "Yearly",
    event: "Event",
};

// Chart CSS variables — defined in tailwind.config.js, dark-mode-aware automatically.
export const EARN_CHART_VAR = {
    monthly: "--chart-1",
    yearly:  "--chart-4",
    event:   "--chart-3",
};

// ─── Minute conversions ───────────────────────────────────────────────────────

/** Balance display — e.g. "3.25" */
export function minutesToDays(minutes) {
    return ((parseInt(minutes, 10) || 0) / MINS_PER_DAY).toFixed(2);
}

/** Raw balance string without trailing zeros — used in select dropdowns */
export function minutesToBalance(minutes) {
    const v = (parseInt(minutes, 10) || 0) / MINS_PER_DAY;
    return parseFloat(v.toFixed(4)).toString();
}

/** Hours string — e.g. "24.0" */
export function minutesToHrs(minutes) {
    return ((parseInt(minutes, 10) || 0) / 60).toFixed(1);
}

// ─── Date / file helpers ──────────────────────────────────────────────────────

export function formatLeaveDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Business-day logic ───────────────────────────────────────────────────────

/**
 * Count working days between two ISO date strings, excluding holidays.
 * Weekends are only excluded when skipWeekends=true (shift_type==1 AND team==1).
 * Other shifts/teams may work on weekends, so those days count.
 */
export function countWorkingDays(start, end, holidaySet, skipWeekends = true) {
    if (!start || !end) return 0;
    const cur = new Date(start + "T12:00:00");
    const fin = new Date(end + "T12:00:00");
    let n = 0;
    while (cur <= fin) {
        const d = cur.getDay();
        const isWeekend = d === 0 || d === 6;
        if (
            !(skipWeekends && isWeekend) &&
            !holidaySet.has(cur.toISOString().slice(0, 10))
        )
            n++;
        cur.setDate(cur.getDate() + 1);
    }
    return n;
}

/** Returns true if the leave start date violates the advance-filing rule for the given type. */
export function isLateFiling(type, start) {
    if (!type || !start || !APPEAL_TYPES.includes(type)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((new Date(start) - today) / 86_400_000);
    return daysUntil < VL_ADVANCE_DAYS;
}
