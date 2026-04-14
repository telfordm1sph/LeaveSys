import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Badge }  from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input }  from "@/Components/ui/input";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    ArrowLeft, Search,
} from "lucide-react";

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

function fmtMin(n)  { return Number(n).toLocaleString(); }
function fmtDays(m) { return (Math.abs(m) / 480).toFixed(2); }

export default function Logs({ employid, name, logs, leaveTypes, filterType, search: serverSearch }) {
    const [searchInput, setSearchInput] = useState(serverSearch ?? "");

    function navigate(params) {
        router.get(route("admin.leave.balances.logs", employid), { ...params }, { preserveScroll: true });
    }

    function applyFilter(type) {
        navigate({ leave_type: type || undefined, search: searchInput || undefined });
    }

    function doSearch() {
        navigate({ leave_type: filterType || undefined, search: searchInput || undefined });
    }

    function goPage(url) {
        router.get(url, {}, { preserveScroll: true });
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
                </div>

                {/* Log table */}
                {logs.total === 0 && !serverSearch && !filterType ? (
                    <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                        No accrual log entries found.
                    </div>
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden">

                        {/* ── Toolbar ────────────────────────────────────── */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 bg-muted/20">
                            {/* Search */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        className="h-7 pl-8 text-xs"
                                        placeholder="Search remarks or action…"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && doSearch()}
                                    />
                                </div>
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={doSearch}>
                                    Search
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                {/* Leave-type filter */}
                                <Select value={filterType || "all"} onValueChange={v => applyFilter(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-7 w-44 text-xs">
                                        <SelectValue placeholder="All leave types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All leave types</SelectItem>
                                        {leaveTypes.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {logs.total.toLocaleString()} {logs.total === 1 ? "entry" : "entries"}
                                </span>
                            </div>
                        </div>

                        {logs.data.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No entries match your search.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Leave #</th>
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
                                                <td className="px-4 py-2.5 text-xs">
                                                    {l.leave_request_id
                                                        ? <span className="font-mono text-muted-foreground">#{l.leave_request_id}</span>
                                                        : <span className="text-muted-foreground/40">—</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-2.5 text-right leading-tight">
                                                    {l.minutes_before === 0
                                                        ? <p className="text-xs text-muted-foreground/40 tabular-nums">—</p>
                                                        : <>
                                                            <p className="text-xs font-semibold tabular-nums">{fmtDays(l.minutes_before)}</p>
                                                            <p className="text-[10px] text-muted-foreground tabular-nums">{fmtMin(l.minutes_before)} min</p>
                                                          </>
                                                    }
                                                </td>
                                                <td className={`px-4 py-2.5 text-right leading-tight ${l.minutes_delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                                                    {l.minutes_delta === 0
                                                        ? <p className="text-xs text-muted-foreground/40">—</p>
                                                        : <>
                                                            <p className="text-xs font-semibold tabular-nums">{l.minutes_delta > 0 ? "+" : "−"}{fmtDays(l.minutes_delta)}</p>
                                                            <p className="text-[10px] opacity-70 tabular-nums">{l.minutes_delta > 0 ? "+" : "−"}{fmtMin(Math.abs(l.minutes_delta))} min</p>
                                                          </>
                                                    }
                                                </td>
                                                <td className="px-4 py-2.5 text-right leading-tight">
                                                    {l.minutes_after === 0
                                                        ? <p className="text-xs text-muted-foreground/40 tabular-nums">—</p>
                                                        : <>
                                                            <p className="text-xs font-bold tabular-nums">{fmtDays(l.minutes_after)}</p>
                                                            <p className="text-[10px] text-muted-foreground tabular-nums">{fmtMin(l.minutes_after)} min</p>
                                                          </>
                                                    }
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
                        )}

                        {/* ── Pagination ──────────────────────────────────── */}
                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-3">
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={logs.current_page <= 1}
                                    onClick={() => goPage(logs.first_page_url)}>
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={logs.current_page <= 1}
                                    onClick={() => goPage(logs.prev_page_url)}>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="px-2 text-xs text-muted-foreground">
                                    <strong>{logs.current_page}</strong> / <strong>{logs.last_page}</strong>
                                </span>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={logs.current_page >= logs.last_page}
                                    onClick={() => goPage(logs.next_page_url)}>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                    disabled={logs.current_page >= logs.last_page}
                                    onClick={() => goPage(logs.last_page_url)}>
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
