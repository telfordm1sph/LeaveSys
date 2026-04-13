import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Badge }  from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

const ACTION_COLORS = {
    accrual:         "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    yearly_reset:    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    used:            "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    refund:          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    carryover:       "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    converted:       "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    forfeited:       "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    opening_balance: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    manual_adj:      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

function fmtMin(n) { return Number(n).toLocaleString(); }

export default function Logs({ employid, name, logs, leaveTypes, filterType }) {
    function applyFilter(type) {
        router.get(route("admin.leave.balances.logs", employid), { leave_type: type || undefined });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Accrual Log — ${name ?? employid}`} />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <button
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => router.get(route("admin.leave.balances", { employid }))}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <h1 className="text-xl font-bold leading-none">Accrual Log</h1>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {name ?? "—"} &ensp;·&ensp; ID: {employid}
                        </p>
                    </div>

                    {/* Leave-type filter */}
                    <Select value={filterType || "all"} onValueChange={v => applyFilter(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-9 w-44 text-xs">
                            <SelectValue placeholder="All leave types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All leave types</SelectItem>
                            {leaveTypes.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Log table */}
                {logs.total === 0 ? (
                    <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                        No accrual log entries found.
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20">
                            <span className="text-sm font-semibold">
                                {logs.total.toLocaleString()} {logs.total === 1 ? "entry" : "entries"}
                                {filterType ? ` · ${filterType}` : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Page {logs.current_page} / {logs.last_page}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Action</th>
                                        <th className="px-4 py-3 text-right">Before</th>
                                        <th className="px-4 py-3 text-right">Delta</th>
                                        <th className="px-4 py-3 text-right">After</th>
                                        <th className="px-4 py-3">Remarks</th>
                                        <th className="px-4 py-3">By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {logs.data.map(l => (
                                        <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                                {l.created_at}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs font-semibold">{l.leave_type}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ACTION_COLORS[l.action_type] ?? "bg-muted text-muted-foreground"}`}>
                                                    {l.action_type.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 tabular-nums text-right text-xs text-muted-foreground">
                                                {fmtMin(l.minutes_before)}
                                            </td>
                                            <td className={`px-4 py-2.5 tabular-nums text-right text-xs font-semibold ${l.minutes_delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                                                {l.minutes_delta >= 0 ? "+" : ""}{fmtMin(l.minutes_delta)}
                                            </td>
                                            <td className="px-4 py-2.5 tabular-nums text-right text-xs font-bold">
                                                {fmtMin(l.minutes_after)}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[220px] truncate">
                                                {l.remarks}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {l.triggered_by}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                                <Button size="icon" variant="ghost" className="h-8 w-8"
                                    disabled={logs.current_page <= 1}
                                    onClick={() => router.get(logs.prev_page_url)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    {logs.current_page} / {logs.last_page}
                                </span>
                                <Button size="icon" variant="ghost" className="h-8 w-8"
                                    disabled={logs.current_page >= logs.last_page}
                                    onClick={() => router.get(logs.next_page_url)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
