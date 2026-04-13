import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Button }  from "@/Components/ui/button";
import { Badge }   from "@/Components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

function MinDisplay({ minutes }) {
    const days = (minutes / 480).toFixed(2);
    return (
        <span className="tabular-nums">
            {days}d <span className="text-muted-foreground text-[10px]">({minutes.toLocaleString()} min)</span>
        </span>
    );
}

export default function Logs({ config, logs }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Year-End ${config.year} — Logs`} />

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Link href={route("admin.leave.year-end")}>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Year-End {config.year} — Conversion Log</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Run date: {config.run_date} &middot; Rate: ₱{Number(config.cash_rate_per_day).toLocaleString("en-PH", { minimumFractionDigits: 2 })}/day
                            &middot; Carryover: {config.max_carryover_days}d &middot; Convertible: {config.max_convertible_days}d
                        </p>
                    </div>
                    <Badge className={config.status === "completed" ? "bg-emerald-500 ml-auto" : "ml-auto"}>
                        {config.status}
                    </Badge>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20">
                        <span className="text-sm font-semibold">{logs.total} employees processed</span>
                        <span className="text-xs text-muted-foreground">Page {logs.current_page} / {logs.last_page}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Employee ID</th>
                                    <th className="px-4 py-3 text-right">Balance Before</th>
                                    <th className="px-4 py-3 text-right">Carryover</th>
                                    <th className="px-4 py-3 text-right">Converted</th>
                                    <th className="px-4 py-3 text-right">Forfeited</th>
                                    <th className="px-4 py-3 text-right">Cash Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.data.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                        {config.status === "pending"
                                            ? "Year-end processing has not run yet."
                                            : "No records found."}
                                    </td></tr>
                                )}
                                {logs.data.map(row => (
                                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{row.employid}</td>
                                        <td className="px-4 py-3 text-right text-xs"><MinDisplay minutes={row.balance_before_minutes} /></td>
                                        <td className="px-4 py-3 text-right text-xs text-emerald-600"><MinDisplay minutes={row.carryover_minutes} /></td>
                                        <td className="px-4 py-3 text-right text-xs text-blue-600"><MinDisplay minutes={row.converted_minutes} /></td>
                                        <td className="px-4 py-3 text-right text-xs text-destructive"><MinDisplay minutes={row.forfeited_minutes} /></td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                            ₱{Number(row.cash_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                            <span className="text-xs text-muted-foreground">{logs.current_page} / {logs.last_page}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                disabled={logs.current_page >= logs.last_page}
                                onClick={() => router.get(logs.next_page_url)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
