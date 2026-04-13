// ── Date / time formatters ────────────────────────────────────────────────────

export function fmtDate(d) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
    });
}

export function fmtDateRange(start, end) {
    if (!start) return "—";
    if (!end || start === end) return fmtDate(start);
    return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export function fmtMins(m) {
    const mins = parseInt(m, 10) || 0;
    const days = Math.floor(mins / 480);
    const hrs  = ((mins % 480) / 60).toFixed(1);
    if (days > 0) return +hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
    return `${hrs}h`;
}

// ── Status config ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
    pending: {
        label : "Pending",
        cls   : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    partially_approved: {
        label : "Partially Approved",
        cls   : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    approved: {
        label : "Approved",
        cls   : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
        label : "Rejected",
        cls   : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    cancelled: {
        label : "Cancelled",
        cls   : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
};

export const PENDING_STATUSES = ["pending", "partially_approved"];
