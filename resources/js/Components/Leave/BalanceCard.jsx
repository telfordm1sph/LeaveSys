import { EARN_COLORS, EARN_TYPE_LABEL, minutesToDays, minutesToHrs, formatLeaveDate } from "@/lib/leaveUtils";

export default function BalanceCard({ balance }) {
    const minutes = parseInt(balance.balance_minutes, 10) || 0;
    const days    = minutes / 480;
    const isLow   = days < 1;
    const colors  = EARN_COLORS[balance.earn_type] ?? EARN_COLORS.monthly;

    const nextDate =
        balance.earn_type === "monthly" && balance.next_accrual_date ? formatLeaveDate(balance.next_accrual_date) :
        balance.earn_type === "yearly"  && balance.next_yearly_date  ? formatLeaveDate(balance.next_yearly_date)  :
        balance.earn_type === "event"   ? "On event" : "—";

    const nextLabel = balance.earn_type === "monthly" ? "Next accrual" : "Next grant";

    return (
        <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
            {/* Top: label + type pill */}
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
                    {minutesToDays(minutes)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {minutesToHrs(minutes)} hrs &nbsp;·&nbsp; {minutes.toLocaleString()} min
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
