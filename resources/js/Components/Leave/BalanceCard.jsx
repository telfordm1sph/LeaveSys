import { Badge } from "@/Components/ui/badge";
import {
    EARN_CHART_VAR,
    EARN_TYPE_LABEL,
    minutesToDays,
    minutesToHrs,
    formatLeaveDate,
} from "@/lib/leaveUtils";

export default function BalanceCard({ balance }) {
    const minutes    = parseInt(balance.balance_minutes, 10) || 0;
    const days       = minutes / 480;
    const isLow      = minutes > 0 && days < 1;
    const chartVar   = EARN_CHART_VAR[balance.earn_type] ?? EARN_CHART_VAR.monthly;
    const accentColor = `hsl(var(${chartVar}))`;

    const nextDate =
        balance.earn_type === "monthly" && balance.next_accrual_date ? formatLeaveDate(balance.next_accrual_date) :
        balance.earn_type === "yearly"  && balance.next_yearly_date  ? formatLeaveDate(balance.next_yearly_date)  :
        balance.earn_type === "event"   ? "On event" : "—";

    const nextLabel = balance.earn_type === "monthly" ? "Next accrual" : "Next grant";

    return (
        <div
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
            style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
        >
            {/* Top: label + earn-type pill */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                        {balance.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{balance.leave_type}</p>
                </div>
                <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: accentColor, borderColor: accentColor }}
                >
                    {EARN_TYPE_LABEL[balance.earn_type]}
                </Badge>
            </div>

            {/* Balance — fixed height so cards stay aligned */}
            <div className="min-h-[3.25rem] flex flex-col justify-center">
                {minutes === 0 ? (
                    <p className="text-3xl font-bold leading-none text-muted-foreground/40">—</p>
                ) : (
                    <>
                        <p
                            className="text-3xl font-bold tabular-nums leading-none"
                            style={{ color: isLow ? "hsl(var(--destructive))" : accentColor }}
                        >
                            {minutesToDays(minutes)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                            {minutesToHrs(minutes)} hrs &nbsp;·&nbsp; {minutes.toLocaleString()} min
                        </p>
                    </>
                )}
            </div>

            {/* Next date */}
            <div className="border-t border-border pt-2.5">
                <p className="text-[10px] text-muted-foreground">{nextLabel}</p>
                <p className="text-xs font-medium text-card-foreground">{nextDate}</p>
            </div>
        </div>
    );
}
