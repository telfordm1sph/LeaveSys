import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";
import BalanceCard from "@/Components/Leave/BalanceCard";
import { Badge }  from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
function fmtDays(mins) { return (Math.abs(mins) / 480).toFixed(2); }

export default function Balances({ balances, logs, leaveTypes, filterType }) {
    const { emp_data } = usePage().props;

    const totalDays = balances.reduce((s, b) => s + (parseInt(b.balance_minutes, 10) || 0) / 480, 0);
    const lowCount  = balances.filter((b) => (parseInt(b.balance_minutes, 10) || 0) / 480 < 1).length;

    function applyFilter(type) {
        router.get(route("leave.balances"), { leave_type: type || undefined });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Leave Balances" />

            <div className="space-y-5">

                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-bold leading-none">Leave Balances</h1>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {emp_data?.emp_name}&ensp;·&ensp;1 day = 8 hrs = 480 min
                        </p>
                    </div>
                    {balances.length > 0 && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                                <span className="font-semibold text-foreground">{totalDays.toFixed(2)}</span> total days
                            </span>
                            {lowCount > 0 && (
                                <span className="font-medium text-destructive">
                                    {lowCount} low balance{lowCount > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Balance cards */}
                {balances.length === 0 ? (
                    <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                        No leave balance records found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {balances.map((b) => <BalanceCard key={b.id} balance={b} />)}
                    </div>
                )}

                {/* Accrual log */}
                {logs && (
                    <div className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20 gap-3">
                            <span className="text-sm font-semibold shrink-0">Leave History</span>
                            <div className="flex items-center gap-3 ml-auto">
                                {leaveTypes?.length > 0 && (
                                    <Select value={filterType || "all"} onValueChange={v => applyFilter(v === "all" ? "" : v)}>
                                        <SelectTrigger className="h-7 w-36 text-xs">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All types</SelectItem>
                                            {leaveTypes.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {logs.current_page} / {logs.last_page}
                                </span>
                            </div>
                        </div>

                        {logs.data.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No history entries found.
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
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {l.remarks}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

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
