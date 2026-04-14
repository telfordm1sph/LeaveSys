import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { Button }   from "@/Components/ui/button";
import { Input }    from "@/Components/ui/input";
import { Label }    from "@/Components/ui/label";
import { Badge }    from "@/Components/ui/badge";
import { Combobox } from "@/Components/ui/combobox";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { SlidersHorizontal, ScrollText, CalendarClock, RefreshCw } from "lucide-react";

function toDisplayDays(minutes) { return (parseInt(minutes) / 480).toFixed(2); }
function toDisplayMin(minutes)  { return parseInt(minutes).toLocaleString(); }

const EARN_CHART_VAR = { monthly: "--chart-1", yearly: "--chart-4", event: "--chart-3" };
function accentColor(earnType) {
    return `hsl(var(${EARN_CHART_VAR[earnType] ?? EARN_CHART_VAR.monthly}))`;
}

export default function Index({ employid, employee }) {
    const { flash } = usePage().props;
    const [adjustTarget, setAdjustTarget] = useState(null);

    const seedOptions = employid && employee?.name
        ? [{ value: employid, label: `${employid} - ${employee.name}` }]
        : [];

    async function loadOptions(search, page) {
        const { data } = await axios.get(route("admin.employees"), {
            params: { search: search ?? "", page: page ?? 1 },
        });
        return data;
    }

    const adjustForm = useForm({
        employid:      employid ?? "",
        leave_type:    "",
        minutes_delta: "",
        remarks:       "",
    });

    function openAdjust(balance) {
        setAdjustTarget(balance);
        adjustForm.setData({
            employid,
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

    return (
        <AuthenticatedLayout>
            <Head title="Employee Balances" />

            <div className="space-y-4">

                {/* ── Top bar ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold leading-none">Employee Leave Balances</h1>
                        {employee?.name
                            ? <p className="mt-0.5 text-sm text-muted-foreground truncate">{employee.name} <span className="opacity-50">· #{employid}</span></p>
                            : <p className="mt-0.5 text-xs text-muted-foreground">Select an employee to view balances.</p>
                        }
                    </div>

                    <div className="w-72">
                        <Combobox
                            value={employid ?? ""}
                            options={seedOptions}
                            loadOptions={loadOptions}
                            placeholder="Search employee…"
                            clearable={false}
                            className="h-9"
                            onChange={(v) => {
                                if (v) router.get(route("admin.leave.balances"), { employid: v });
                            }}
                        />
                    </div>

                    {employee?.name && (
                        <Button size="sm" variant="outline" className="gap-1.5 h-9 shrink-0"
                            onClick={() => router.get(route("admin.leave.balances.logs", employid))}>
                            <ScrollText className="h-4 w-4" /> Accrual Log
                        </Button>
                    )}
                </div>

                {/* ── Flash ───────────────────────────────────────────────── */}
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                {/* ── Not found ───────────────────────────────────────────── */}
                {employid && !employee?.name && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Employee <strong>#{employid}</strong> not found or has no leave balances.
                    </div>
                )}

                {/* ── Balance cards ────────────────────────────────────────── */}
                {employee?.name && balances.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {balances.map((b) => {
                            const color  = accentColor(b.earn_type);
                            const mins   = parseInt(b.balance_minutes) || 0;
                            const isLow  = mins > 0 && mins / 480 < 1;
                            return (
                                <div key={b.id}
                                    className="rounded-xl border border-border bg-card flex flex-col gap-3 p-4 transition-colors"
                                    style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="truncate text-sm font-semibold text-card-foreground">{b.label}</p>
                                        <span
                                            className="shrink-0 font-mono text-[10px] font-bold tracking-wide border rounded px-1.5 py-0.5"
                                            style={{ color, borderColor: color }}
                                        >
                                            {b.leave_type}
                                        </span>
                                    </div>

                                    {/* Balance — fixed height for alignment */}
                                    <div className="min-h-[3.25rem] flex flex-col justify-center">
                                        {mins === 0 ? (
                                            <p className="text-3xl font-bold leading-none text-muted-foreground/40">—</p>
                                        ) : (
                                            <>
                                                <p
                                                    className="text-3xl font-extrabold tabular-nums leading-none"
                                                    style={{ color: isLow ? "hsl(var(--destructive))" : color }}
                                                >
                                                    {toDisplayDays(b.balance_minutes)}
                                                </p>
                                                <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                                                    {toDisplayMin(b.balance_minutes)} min
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-1 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarClock className="h-3 w-3 shrink-0" />
                                            <span>Accrual: <span className="font-mono">{b.next_accrual_date ?? "—"}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <RefreshCw className="h-3 w-3 shrink-0" />
                                            <span>Yearly: <span className="font-mono">{b.next_yearly_date ?? "—"}</span></span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <Button size="sm" variant="outline"
                                        className="mt-auto h-7 w-full text-xs gap-1"
                                        onClick={() => openAdjust(b)}>
                                        <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Adjust Dialog ────────────────────────────────────────────── */}
            <Dialog open={!!adjustTarget} onOpenChange={(v) => !v && setAdjustTarget(null)}>
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
                            <Input type="number"
                                value={adjustForm.data.minutes_delta}
                                onChange={(e) => adjustForm.setData("minutes_delta", e.target.value)}
                                placeholder="Use negative to deduct, e.g. -480" />
                            <p className="text-[10px] text-muted-foreground">480 = 1 day. Use negative to deduct.</p>
                            {adjustForm.errors.minutes_delta && <p className="text-xs text-destructive">{adjustForm.errors.minutes_delta}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Reason / Remarks <span className="text-destructive">*</span></Label>
                            <Input
                                value={adjustForm.data.remarks}
                                onChange={(e) => adjustForm.setData("remarks", e.target.value)}
                                placeholder="e.g. Opening balance correction" />
                            {adjustForm.errors.remarks && <p className="text-xs text-destructive">{adjustForm.errors.remarks}</p>}
                        </div>
                        {adjustForm.errors.general && <p className="text-xs text-destructive">{adjustForm.errors.general}</p>}
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
