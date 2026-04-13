import { CheckCircle2, XCircle, Clock, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtMins, STATUS_CONFIG } from "@/lib/leaveRequestUtils";

// ── Status badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
    const { label, cls } = STATUS_CONFIG[status] ?? { label: status, cls: "" };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
            {label}
        </span>
    );
}

// ── Approver progress dots ────────────────────────────────────────────────────

export function ApproverDots({ approvers }) {
    if (!approvers?.length) return <span className="text-xs text-muted-foreground">—</span>;
    return (
        <div className="flex items-center gap-1">
            {approvers.map((a) => {
                const icon =
                    a.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> :
                    a.status === "rejected"  ? <XCircle      className="h-3.5 w-3.5 text-red-500" />    :
                                              <Clock        className="h-3.5 w-3.5 text-muted-foreground/40" />;
                return (
                    <span
                        key={a.id}
                        title={`L${a.approver_level}: ${a.approver_name ?? "#" + a.approver_employid} — ${a.status}`}>
                        {icon}
                    </span>
                );
            })}
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────────────────

export function SectionLabel({ title, count }) {
    return (
        <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </span>
            {count !== undefined && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {count}
                </span>
            )}
        </div>
    );
}

// ── Main table ────────────────────────────────────────────────────────────────

/**
 * @param {object[]}  rows
 * @param {boolean}   showApproverActions  - true when rendering "Awaiting My Approval" section
 * @param {function}  onApprove
 * @param {function}  onReject
 */
export function RequestsTable({ rows = [], showApproverActions = false, onApprove, onReject }) {
    if (!rows.length) {
        return (
            <div className="rounded-xl border border-border py-8 text-center text-sm text-muted-foreground">
                No records found.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        {showApproverActions && <th className="px-4 py-2.5">Employee</th>}
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Period</th>
                        <th className="px-4 py-2.5 text-center">Days</th>
                        <th className="px-4 py-2.5 text-center">Deducted</th>
                        {!showApproverActions && <th className="px-4 py-2.5">Status</th>}
                        <th className="px-4 py-2.5">Approvers</th>
                        {showApproverActions && <th className="px-4 py-2.5 text-center">Level</th>}
                        {!showApproverActions && <th className="px-4 py-2.5">Filed</th>}
                        {showApproverActions && <th className="px-4 py-2.5 max-w-[160px]">Reason</th>}
                        {showApproverActions && <th className="px-4 py-2.5 text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">

                            {showApproverActions && (
                                <td className="px-4 py-2.5">
                                    <p className="text-xs font-medium leading-snug">{r.employee_name}</p>
                                    <p className="text-[10px] text-muted-foreground">#{r.employid}</p>
                                </td>
                            )}

                            <td className="px-4 py-2.5">
                                <span className="font-mono text-xs font-bold">{r.leave_type}</span>
                            </td>

                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                {fmtDate(r.date_start)}
                                {r.date_start !== r.date_end && (
                                    <>
                                        <ChevronRight className="inline h-3 w-3 mx-0.5 opacity-40" />
                                        {fmtDate(r.date_end)}
                                    </>
                                )}
                            </td>

                            <td className="px-4 py-2.5 text-center tabular-nums font-semibold">
                                {r.working_days}
                            </td>

                            <td className="px-4 py-2.5 text-center tabular-nums text-xs text-muted-foreground">
                                {fmtMins(r.deduction_minutes)}
                            </td>

                            {!showApproverActions && (
                                <td className="px-4 py-2.5">
                                    <StatusBadge status={r.status} />
                                </td>
                            )}

                            <td className="px-4 py-2.5">
                                <ApproverDots approvers={r.approvers ?? []} />
                            </td>

                            {showApproverActions && (
                                <td className="px-4 py-2.5 text-center">
                                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                                        L{r.my_approver_level}
                                    </span>
                                </td>
                            )}

                            {!showApproverActions && (
                                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                                    {fmtDate(r.date_posted)}
                                </td>
                            )}

                            {showApproverActions && (
                                <td className="px-4 py-2.5 max-w-[160px]">
                                    <p className="truncate text-xs text-muted-foreground">{r.reason}</p>
                                </td>
                            )}

                            {showApproverActions && (
                                <td className="px-4 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Button size="sm" variant="outline"
                                            className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                            onClick={() => onApprove?.(r)}>
                                            <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline"
                                            className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                            onClick={() => onReject?.(r)}>
                                            <ThumbsDown className="h-3.5 w-3.5" /> Reject
                                        </Button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
