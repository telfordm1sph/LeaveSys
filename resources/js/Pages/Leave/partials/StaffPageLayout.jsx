import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { RequestsTable, SectionLabel, StatusBadge } from "@/Components/Leave/RequestsTable";
import { ApproveDialog, RejectDialog } from "@/Components/Leave/ApprovalDialogs";
import { Pagination } from "./RequestPageLayout";
import { fmtDate, fmtMins } from "@/lib/leaveRequestUtils";
import { useRequestPage } from "../hooks/useRequestPage";

// ── History table (past approver decisions) ───────────────────────────────────

function StaffHistoryTable({ rows = [] }) {
    if (!rows.length) {
        return (
            <div className="rounded-xl border border-border py-8 text-center text-sm text-muted-foreground">
                No history found.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2.5">Employee</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Period</th>
                        <th className="px-4 py-2.5 text-center">Days</th>
                        <th className="px-4 py-2.5 text-center">Deducted</th>
                        <th className="px-4 py-2.5 text-center">My Level</th>
                        <th className="px-4 py-2.5">My Decision</th>
                        <th className="px-4 py-2.5">Remarks</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">Decided At</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5">
                                <p className="text-xs font-medium leading-snug">{r.employee_name}</p>
                                <p className="text-[10px] text-muted-foreground">#{r.employid}</p>
                            </td>
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
                            <td className="px-4 py-2.5 text-center">
                                <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                                    L{r.my_approver_level}
                                </span>
                            </td>
                            <td className="px-4 py-2.5">
                                <StatusBadge status={r.my_status} />
                            </td>
                            <td className="px-4 py-2.5 max-w-[180px]">
                                <p className="truncate text-xs text-muted-foreground">
                                    {r.my_remarks || <span className="italic opacity-40">—</span>}
                                </p>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                {fmtDate(r.my_decided_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function StaffPageLayout({ title, routeName, pending, history, tab }) {
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget,  setRejectTarget]  = useState(null);

    const { changeTab, changePage } = useRequestPage({ routeName, tab, search: "" });

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="space-y-4">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-bold flex-1">{title}</h1>

                    <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                        <button onClick={() => changeTab("pending")}
                            className={`px-4 py-1.5 transition-colors ${tab === "pending" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                            Pending
                        </button>
                        <button onClick={() => changeTab("history")}
                            className={`px-4 py-1.5 border-l border-border transition-colors ${tab === "history" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                            History
                        </button>
                    </div>
                </div>

                {/* ── Pending tab ──────────────────────────────────────────── */}
                {tab === "pending" && (
                    <div className="space-y-2">
                        <SectionLabel title="Awaiting My Approval" count={pending.length} />
                        <RequestsTable
                            rows={pending}
                            showApproverActions
                            onApprove={(r) => setApproveTarget(r)}
                            onReject={(r)  => setRejectTarget(r)}
                        />
                    </div>
                )}

                {/* ── History tab ──────────────────────────────────────────── */}
                {tab === "history" && history && (
                    <>
                        <div className="space-y-2">
                            <SectionLabel title="My Past Decisions" count={history.total} />
                            <StaffHistoryTable rows={history.data ?? []} />
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {history.total} record{history.total !== 1 ? "s" : ""}
                            </p>
                            <Pagination
                                current={history.current_page}
                                last={history.last_page}
                                onPageChange={changePage}
                            />
                        </div>
                    </>
                )}
            </div>

            <ApproveDialog target={approveTarget} onClose={() => setApproveTarget(null)} />
            <RejectDialog  target={rejectTarget}  onClose={() => setRejectTarget(null)} />
        </AuthenticatedLayout>
    );
}
