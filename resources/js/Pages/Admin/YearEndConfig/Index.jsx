import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import { Badge }   from "@/Components/ui/badge";
import { Button }  from "@/Components/ui/button";
import { Input }   from "@/Components/ui/input";
import { Label }   from "@/Components/ui/label";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Plus, Pencil, FileText, CheckCircle2, Clock } from "lucide-react";

function ConfigForm({ data, setData, errors, showYear = true }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {showYear && (
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Year <span className="text-destructive">*</span></Label>
                    <Input type="number" min="2000" max="2100" value={data.year}
                        onChange={e => setData("year", e.target.value)} placeholder="e.g. 2026" />
                    {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
                </div>
            )}
            <div className="col-span-2 space-y-1">
                <Label className="text-xs">Run Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={data.run_date} onChange={e => setData("run_date", e.target.value)} />
                <p className="text-[10px] text-muted-foreground">
                    Cron fires on or after this date when status is pending.
                </p>
                {errors.run_date && <p className="text-xs text-destructive">{errors.run_date}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max Carryover Days</Label>
                <Input type="number" min="0" value={data.max_carryover_days}
                    onChange={e => setData("max_carryover_days", parseInt(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">VL days that roll to next year</p>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max Convertible Days</Label>
                <Input type="number" min="0" value={data.max_convertible_days}
                    onChange={e => setData("max_convertible_days", parseInt(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Excess VL days convertible to cash</p>
            </div>
            <div className="col-span-2 space-y-1">
                <Label className="text-xs">Cash Rate per Day (₱)</Label>
                <Input type="number" min="0" step="0.01" value={data.cash_rate_per_day}
                    onChange={e => setData("cash_rate_per_day", e.target.value)} />
            </div>
        </div>
    );
}

const blank = { year: new Date().getFullYear() + 1, run_date: "", max_carryover_days: 5, max_convertible_days: 3, cash_rate_per_day: "0.00" };

export default function Index({ configs }) {
    const { flash, errors: pageErrors } = usePage().props;

    const [showAdd, setShowAdd]         = useState(false);
    const [editTarget, setEditTarget]   = useState(null);

    const addForm  = useForm({ ...blank });
    const editForm = useForm({ ...blank });

    function submitAdd(e) {
        e.preventDefault();
        addForm.post(route("admin.leave.year-end.store"), {
            onSuccess: () => { setShowAdd(false); addForm.reset(); },
        });
    }

    function openEdit(cfg) {
        setEditTarget(cfg);
        editForm.setData({
            run_date:             cfg.run_date,
            max_carryover_days:   cfg.max_carryover_days,
            max_convertible_days: cfg.max_convertible_days,
            cash_rate_per_day:    cfg.cash_rate_per_day,
        });
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.patch(route("admin.leave.year-end.update", editTarget.id), {
            onSuccess: () => setEditTarget(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Year-End Config" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Year-End Config</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Configure year-end VL carryover, cash conversion, and forfeit rules per year.
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="h-4 w-4 mr-1.5" /> New Config
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                {pageErrors?.general && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                        {pageErrors.general}
                    </div>
                )}

                {/* Year-end logic reference */}
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">How Year-End Processing Works</p>
                    <p>1. <strong>Carryover</strong> = min(balance, max_carryover × 480 min). New balance = carryover.</p>
                    <p>2. <strong>Excess</strong> = original balance − carryover.</p>
                    <p>3. <strong>Convert</strong> = min(excess, max_convertible × 480 min). Cash = (converted ÷ 480) × rate.</p>
                    <p>4. <strong>Forfeit</strong> = excess − converted. Lost forever.</p>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-4 py-3">Year</th>
                                <th className="px-4 py-3">Run Date</th>
                                <th className="px-4 py-3 text-right">Carryover</th>
                                <th className="px-4 py-3 text-right">Convertible</th>
                                <th className="px-4 py-3 text-right">Cash Rate</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-muted-foreground text-xs">Ran At</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {configs.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                    No year-end configs yet.
                                </td></tr>
                            )}
                            {configs.map(cfg => (
                                <tr key={cfg.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-bold tabular-nums">{cfg.year}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{cfg.run_date}</td>
                                    <td className="px-4 py-3 tabular-nums text-right text-xs">{cfg.max_carryover_days} days</td>
                                    <td className="px-4 py-3 tabular-nums text-right text-xs">{cfg.max_convertible_days} days</td>
                                    <td className="px-4 py-3 tabular-nums text-right text-xs">
                                        ₱{Number(cfg.cash_rate_per_day).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {cfg.status === "completed"
                                            ? <Badge className="bg-emerald-500 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>
                                            : <Badge variant="outline" className="text-[10px] gap-1"><Clock className="h-3 w-3" />Pending</Badge>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                                        {cfg.ran_at ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            {cfg.status === "pending" && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cfg)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Link href={route("admin.leave.year-end.logs", cfg.id)}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                                    <FileText className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Year-End Config</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <ConfigForm data={addForm.data} setData={addForm.setData} errors={addForm.errors} showYear />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button type="submit" disabled={addForm.processing}>
                                {addForm.processing ? "Saving…" : "Create Config"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Year-End Config — {editTarget?.year}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <ConfigForm data={editForm.data} setData={editForm.setData} errors={editForm.errors} showYear={false} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? "Saving…" : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
