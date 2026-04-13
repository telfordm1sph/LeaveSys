import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { Badge }    from "@/Components/ui/badge";
import { Button }   from "@/Components/ui/button";
import { Input }    from "@/Components/ui/input";
import { Label }    from "@/Components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

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

function toDisplayDays(minutes) {
    return Math.floor(parseInt(minutes) / 480);
}

function toDisplayMin(minutes) {
    return parseInt(minutes).toLocaleString();
}

export default function Index({ employid, employee }) {
    const { flash } = usePage().props;

    const [searchId, setSearchId]       = useState(employid ? String(employid) : "");
    const [adjustTarget, setAdjustTarget] = useState(null);

    const adjustForm = useForm({
        employid:      employid ?? "",
        leave_type:    "",
        minutes_delta: "",
        remarks:       "",
    });

    function doSearch(e) {
        e.preventDefault();
        if (!searchId.trim()) return;
        router.get(route("admin.leave.balances"), { employid: searchId });
    }

    function openAdjust(balance) {
        setAdjustTarget(balance);
        adjustForm.setData({
            employid:      employid,
            leave_type:    balance.leave_type,
            minutes_delta: "",
            remarks:       "",
        });
    }

    function submitAdjust(e) {
        e.preventDefault();
        adjustForm.post(route("admin.leave.balances.adjust"), {
            onSuccess: () => setAdjustTarget(null),
        });
    }

    const balances = employee?.balances ?? [];
    const logs     = employee?.logs ?? null;

    return (
        <AuthenticatedLayout>
            <Head title="Employee Balances" />

            <div className="space-y-5">
                <div>
                    <h1 className="text-xl font-bold">Employee Leave Balances</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Search by employee ID to view and adjust balances.
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={doSearch} className="flex gap-2 max-w-sm">
                    <Input
                        placeholder="Employee ID…"
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                        className="h-9"
                    />
                    <Button type="submit" size="sm">
                        <Search className="h-4 w-4 mr-1.5" /> Search
                    </Button>
                </form>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                {employid && !employee?.name && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Employee ID <strong>{employid}</strong> not found or has no leave balances.
                    </div>
                )}

                {employee?.name && (
                    <>
                        {/* Employee header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">{employee.name}</h2>
                                <p className="text-xs text-muted-foreground">ID: {employid}</p>
                            </div>
                        </div>

                        {/* Balances table */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="border-b border-border px-4 py-2.5 bg-muted/20">
                                <span className="text-sm font-semibold">Leave Balances</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Label</th>
                                        <th className="px-4 py-3 text-right">Balance</th>
                                        <th className="px-4 py-3 text-right">Minutes</th>
                                        <th className="px-4 py-3">Next Accrual</th>
                                        <th className="px-4 py-3">Next Yearly</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {balances.map(b => (
                                        <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold">{b.leave_type}</td>
                                            <td className="px-4 py-3">{b.label}</td>
                                            <td className="px-4 py-3 tabular-nums text-right font-bold">
                                                {toDisplayDays(b.balance_minutes)} days
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-right text-xs text-muted-foreground">
                                                {toDisplayMin(b.balance_minutes)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {b.next_accrual_date ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {b.next_yearly_date ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                                    onClick={() => openAdjust(b)}>
                                                    <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Accrual log */}
                        {logs && (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20">
                                    <span className="text-sm font-semibold">Accrual Log</span>
                                    <span className="text-xs text-muted-foreground">
                                        Page {logs.current_page} / {logs.last_page}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                                <th className="px-4 py-3">When</th>
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
                                                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ACTION_COLORS[l.action_type] ?? ""}`}>
                                                            {l.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 tabular-nums text-right text-xs text-muted-foreground">{l.minutes_before.toLocaleString()}</td>
                                                    <td className={`px-4 py-2.5 tabular-nums text-right text-xs font-semibold ${l.minutes_delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                                        {l.minutes_delta >= 0 ? "+" : ""}{l.minutes_delta.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-2.5 tabular-nums text-right text-xs font-bold">{l.minutes_after.toLocaleString()}</td>
                                                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{l.remarks}</td>
                                                    <td className="px-4 py-2.5">
                                                        <Badge variant="outline" className="text-[10px] capitalize">{l.triggered_by}</Badge>
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
                        )}
                    </>
                )}
            </div>

            {/* Adjust Dialog */}
            <Dialog open={!!adjustTarget} onOpenChange={v => !v && setAdjustTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Balance — {adjustTarget?.leave_type}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdjust} className="space-y-4">
                        <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-1 text-xs">
                            <p>Current balance: <strong>{adjustTarget ? toDisplayDays(adjustTarget.balance_minutes) : 0} days</strong>
                                <span className="text-muted-foreground ml-2">({adjustTarget?.balance_minutes?.toLocaleString()} min)</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Minutes to Add / Subtract <span className="text-destructive">*</span></Label>
                            <Input type="number" value={adjustForm.data.minutes_delta}
                                onChange={e => adjustForm.setData("minutes_delta", e.target.value)}
                                placeholder="Use negative to deduct, e.g. -480" />
                            <p className="text-[10px] text-muted-foreground">480 = 1 day. Use negative to deduct.</p>
                            {adjustForm.errors.minutes_delta && <p className="text-xs text-destructive">{adjustForm.errors.minutes_delta}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Reason / Remarks <span className="text-destructive">*</span></Label>
                            <Input value={adjustForm.data.remarks}
                                onChange={e => adjustForm.setData("remarks", e.target.value)}
                                placeholder="e.g. Opening balance correction" />
                            {adjustForm.errors.remarks && <p className="text-xs text-destructive">{adjustForm.errors.remarks}</p>}
                        </div>
                        {adjustForm.errors.general && (
                            <p className="text-xs text-destructive">{adjustForm.errors.general}</p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={adjustForm.processing}>
                                {adjustForm.processing ? "Saving…" : "Apply Adjustment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
