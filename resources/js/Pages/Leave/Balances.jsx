import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EARN_TYPE_LABEL = {
    monthly: "Monthly",
    yearly:  "Yearly",
    event:   "Event",
};

const EARN_COLORS = {
    monthly: { bg: "bg-blue-50 dark:bg-blue-950/40", accent: "text-blue-600 dark:text-blue-400", pill: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
    yearly:  { bg: "bg-violet-50 dark:bg-violet-950/40", accent: "text-violet-600 dark:text-violet-400", pill: "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
    event:   { bg: "bg-amber-50 dark:bg-amber-950/40", accent: "text-amber-600 dark:text-amber-400", pill: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDays(minutes) {
    return ((parseInt(minutes, 10) || 0) / 480).toFixed(2);
}

function toHrs(minutes) {
    return ((parseInt(minutes, 10) || 0) / 60).toFixed(1);
}

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// ─── BalanceCard ──────────────────────────────────────────────────────────────

function BalanceCard({ balance }) {
    const minutes = parseInt(balance.balance_minutes, 10) || 0;
    const days    = minutes / 480;
    const isLow   = days < 1;
    const colors  = EARN_COLORS[balance.earn_type] ?? EARN_COLORS.monthly;

    const nextDate =
        balance.earn_type === "monthly" && balance.next_accrual_date ? formatDate(balance.next_accrual_date) :
        balance.earn_type === "yearly"  && balance.next_yearly_date  ? formatDate(balance.next_yearly_date)  :
        balance.earn_type === "event"   ? "On event" : "—";

    const nextLabel =
        balance.earn_type === "monthly" ? "Next accrual" : "Next grant";

    return (
        <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
            {/* Top row: label + type pill */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{balance.label}</p>
                    <p className="text-[11px] text-muted-foreground">{balance.leave_type}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.pill}`}>
                    {EARN_TYPE_LABEL[balance.earn_type]}
                </span>
            </div>

            {/* Balance */}
            <div className="mt-3">
                <p className={`text-3xl font-bold tabular-nums leading-none ${isLow ? "text-destructive" : colors.accent}`}>
                    {toDays(minutes)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {toHrs(minutes)} hrs &nbsp;·&nbsp; {minutes.toLocaleString()} min
                </p>
            </div>

            {/* Next date */}
            <div className="mt-3 border-t border-current/10 pt-2.5">
                <p className="text-[10px] text-muted-foreground">{nextLabel}</p>
                <p className="text-xs font-medium">{nextDate}</p>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Balances({ balances }) {
    const { emp_data } = usePage().props;

    const totalDays = balances.reduce((s, b) => s + (parseInt(b.balance_minutes, 10) || 0) / 480, 0);
    const lowCount  = balances.filter((b) => (parseInt(b.balance_minutes, 10) || 0) / 480 < 1).length;

    return (
        <AuthenticatedLayout>
            <Head title="Leave Balances" />

            <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-bold leading-none">Leave Balances</h1>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {emp_data?.emp_name}&ensp;·&ensp;1 day = 8 hrs = 480 min
                        </p>
                    </div>
                    {balances.length > 0 && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span><span className="font-semibold text-foreground">{totalDays.toFixed(2)}</span> total days</span>
                            {lowCount > 0 && (
                                <span className="text-destructive font-medium">{lowCount} low balance{lowCount > 1 ? "s" : ""}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Balance grid ── */}
                {balances.length === 0 ? (
                    <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                        No leave balance records found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {balances.map((b) => <BalanceCard key={b.id} balance={b} />)}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
