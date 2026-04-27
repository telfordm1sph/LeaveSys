export function fmtDate(d) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function fmtDateRange(start, end) {
    if (!start) return "—";
    if (!end || start === end) return fmtDate(start);
    return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export function fmtDateTime(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
export function fmtMins(m) {
    const mins = parseInt(m, 10) || 0;
    const days = Math.floor(mins / 480);
    const hrs = ((mins % 480) / 60).toFixed(1);
    if (days > 0) return +hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
    return `${hrs}h`;
}

export const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        cls: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    },
    partially_approved: {
        label: "Partially Approved",
        cls: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    approved: {
        label: "Approved",
        cls: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
    rejected: {
        label: "Rejected",
        cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
    cancelled: {
        label: "Cancelled",
        cls: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
    },
};

export const PENDING_STATUSES = ["pending", "partially_approved"];
