import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import { Search, ChevronRight, Hourglass, History } from "lucide-react";
import {
    RequestsTable,
    SectionLabel,
    StatusBadge,
} from "@/Components/Leave/RequestsTable";
import {
    ApproveDialog,
    RejectDialog,
    LeaveDetailsModal,
} from "@/Components/Leave/ApprovalDialogs";
import { Pagination } from "./RequestPageLayout";
import { fmtDate, fmtMins, fmtDateTime } from "@/lib/leaveRequestUtils";
import { useRequestPage } from "../hooks/useRequestPage";

// ── History table (past approver decisions) ───────────────────────────────────

function StaffHistoryTable({ rows = [], onRowClick }) {
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
                        <th className="px-4 py-2.5 text-center">With Pay</th>
                        <th className="px-4 py-2.5 text-center">Without Pay</th>
                        <th className="px-4 py-2.5 text-center">My Level</th>
                        <th className="px-4 py-2.5">My Decision</th>
                        <th className="px-4 py-2.5">Remarks</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">
                            Decided At
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                        <tr
                            key={r.id}
                            onClick={() => onRowClick?.(r)}
                            className={`hover:bg-muted/20 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                        >
                            <td className="px-4 py-2.5">
                                <p className="text-xs font-medium leading-snug">
                                    {r.employee_name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    #{r.employid}
                                </p>
                            </td>
                            <td className="px-4 py-2.5">
                                <span className="font-mono text-xs font-bold">
                                    {r.leave_type}
                                </span>
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
                            <td className="px-4 py-2.5 text-center tabular-nums text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                {fmtMins(r.paid_minutes)}
                            </td>
                            <td className="px-4 py-2.5 text-center tabular-nums text-xs">
                                {r.unpaid_minutes > 0 ? (
                                    <span className="text-destructive font-medium">
                                        {fmtMins(r.unpaid_minutes)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        —
                                    </span>
                                )}
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
                                    {r.my_remarks || (
                                        <span className="italic opacity-40">
                                            —
                                        </span>
                                    )}
                                </p>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                {fmtDateTime(r.my_decided_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function StaffPageLayout({
    title,
    routeName,
    pending,
    history,
    tab,
    search,
}) {
    const [viewTarget, setViewTarget] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);

    const { searchInput, setSearchInput, changeTab, changePage, doSearch } =
        useRequestPage({ routeName, tab, search: search ?? "" });

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="space-y-4">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold">{title}</h1>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                className="h-8 w-72 pl-8 text-sm"
                                placeholder="Search employee or type…"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && doSearch()
                                }
                            />
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={doSearch}
                        >
                            Search
                        </Button>
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <Tabs value={tab} onValueChange={changeTab}>
                    <TabsList>
                        <TabsTrigger value="pending">
                            <Hourglass className="h-3.5 w-3.5" />
                            Pending
                            {pending?.length > 0 && (
                                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                                    {pending.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="h-3.5 w-3.5" />
                            History
                            {history?.total > 0 && (
                                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                                    {history.total}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Pending tab ──────────────────────────────────────── */}
                    <TabsContent value="pending" className="space-y-2">
                        <SectionLabel
                            title="Awaiting My Approval"
                            count={pending?.length}
                        />
                        <RequestsTable
                            rows={pending ?? []}
                            showApproverColumns
                            onRowClick={(r) => setViewTarget(r)}
                        />
                    </TabsContent>

                    {/* ── History tab ──────────────────────────────────────── */}
                    <TabsContent value="history" className="space-y-2">
                        <div className="flex items-center justify-between">
                            <SectionLabel
                                title="My Past Decisions"
                                count={history?.total}
                            />
                            {history && (
                                <p className="text-xs text-muted-foreground">
                                    {history.total} record
                                    {history.total !== 1 ? "s" : ""}
                                    {search && (
                                        <> · matching &ldquo;{search}&rdquo;</>
                                    )}
                                </p>
                            )}
                        </div>
                        <StaffHistoryTable
                            rows={history?.data ?? []}
                            onRowClick={(r) => setViewTarget(r)}
                        />
                        {history && (
                            <div className="flex justify-end">
                                <Pagination
                                    current={history.current_page}
                                    last={history.last_page}
                                    onPageChange={changePage}
                                />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <LeaveDetailsModal
                target={viewTarget}
                onClose={() => setViewTarget(null)}
                onApprove={(r) => {
                    setViewTarget(null);
                    setApproveTarget(r);
                }}
                onReject={(r) => {
                    setViewTarget(null);
                    setRejectTarget(r);
                }}
            />
            <ApproveDialog
                target={approveTarget}
                onClose={() => setApproveTarget(null)}
            />
            <RejectDialog
                target={rejectTarget}
                onClose={() => setRejectTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
