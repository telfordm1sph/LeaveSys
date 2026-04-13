// ─── Constants ────────────────────────────────────────────────────────────────

export const MINS_PER_DAY = 480;
export const VL_ADVANCE_DAYS = 2;
export const HOURS_OPTIONS = [8, 10, 12];
export const APPEAL_TYPES = ["VL"];
export const ATTACHMENT_TYPES = ["EL", "BEREAVEMENT"];

export const EARN_TYPE_LABEL = {
    monthly: "Monthly",
    yearly: "Yearly",
    event: "Event",
};

export const EARN_COLORS = {
    monthly: {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        accent: "text-blue-600 dark:text-blue-400",
        pill: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
    },
    yearly: {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        accent: "text-violet-600 dark:text-violet-400",
        pill: "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
        border: "border-violet-200 dark:border-violet-800",
    },
    event: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        accent: "text-amber-600 dark:text-amber-400",
        pill: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
    },
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
