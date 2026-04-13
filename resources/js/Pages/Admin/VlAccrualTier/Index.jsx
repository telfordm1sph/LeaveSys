import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

function toMonthlyDays(minutes) {
    // e.g. 280 → "7/12"
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const num = minutes / 480;
    const d = 12;
    const n = Math.round(num * d);
    const g = gcd(n, d);
    return `${n / g}/${d / g}`;
}

function TierForm({ data, setData, errors }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label className="text-xs">Tier <span className="text-destructive">*</span></Label>
                <Select value={data.tier} onValueChange={v => setData("tier", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="legacy">Legacy (hired before Apr 2024)</SelectItem>
                        <SelectItem value="new">New (hired Apr 2024+)</SelectItem>
                    </SelectContent>
                </Select>
                {errors.tier && <p className="text-xs text-destructive">{errors.tier}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Monthly Minutes <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" value={data.monthly_minutes}
                    onChange={e => setData("monthly_minutes", parseInt(e.target.value) || "")} />
                <p className="text-[10px] text-muted-foreground">
                    280=7/12 · 320=8/12 · 360=9/12 · 400=10/12 · 440=11/12 · 480=12/12
                </p>
                {errors.monthly_minutes && <p className="text-xs text-destructive">{errors.monthly_minutes}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Year From <span className="text-destructive">*</span></Label>
                <Input type="number" min="0" value={data.year_from}
                    onChange={e => setData("year_from", parseInt(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Years since regularization (0 = first year)</p>
                {errors.year_from && <p className="text-xs text-destructive">{errors.year_from}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Year To</Label>
                <Input type="number" min="0" value={data.year_to ?? ""}
                    onChange={e => setData("year_to", e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="Leave blank = no cap" />
                {errors.year_to && <p className="text-xs text-destructive">{errors.year_to}</p>}
            </div>
        </div>
    );
}

const blank = { tier: "legacy", year_from: 0, year_to: null, monthly_minutes: 280 };

export default function Index({ tiers }) {
    const { flash } = usePage().props;

    const [showAdd, setShowAdd]     = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const addForm    = useForm({ ...blank });
    const editForm   = useForm({ ...blank });
    const deleteForm = useForm({});

    function submitAdd(e) {
        e.preventDefault();
        addForm.post(route("admin.leave.accrual-tiers.store"), {
            onSuccess: () => { setShowAdd(false); addForm.reset(); },
        });
    }

    function openEdit(tier) {
        setEditTarget(tier);
        editForm.setData({
            tier:             tier.tier,
            year_from:        tier.year_from,
            year_to:          tier.year_to,
            monthly_minutes:  tier.monthly_minutes,
        });
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.patch(route("admin.leave.accrual-tiers.update", editTarget.id), {
            onSuccess: () => setEditTarget(null),
        });
    }

    function confirmDelete(tier) {
        setDeleteTarget(tier);
    }

    function submitDelete() {
        deleteForm.delete(route("admin.leave.accrual-tiers.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const legacy = tiers.filter(t => t.tier === "legacy");
    const newHires = tiers.filter(t => t.tier === "new");

    function TierTable({ rows, label }) {
        return (
            <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h2>
                <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-4 py-3">Year Bracket</th>
                                <th className="px-4 py-3 text-right">Monthly Minutes</th>
                                <th className="px-4 py-3 text-right">Rate</th>
                                <th className="px-4 py-3 text-right">Annual Days</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">No tiers defined.</td></tr>
                            )}
                            {rows.map(t => (
                                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        Year {t.year_from}{t.year_to != null ? `–${t.year_to}` : "+"}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-right font-bold">{t.monthly_minutes}</td>
                                    <td className="px-4 py-3 tabular-nums text-right text-muted-foreground text-xs">
                                        {toMonthlyDays(t.monthly_minutes)} day/mo
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-right text-xs">
                                        {((t.monthly_minutes * 12) / 480).toFixed(0)} days/yr
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => confirmDelete(t)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="VL Accrual Tiers" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">VL Accrual Tiers</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Monthly accrual rates by hire tier and service year. Read by Block C cron on Jan 1.
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Tier
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                <TierTable rows={legacy}   label="Legacy Hires (before Apr 2024) — step-up each year" />
                <TierTable rows={newHires} label="New Hires (Apr 2024+) — fixed rate forever" />
            </div>

            {/* Add Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Accrual Tier</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <TierForm data={addForm.data} setData={addForm.setData} errors={addForm.errors} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button type="submit" disabled={addForm.processing}>
                                {addForm.processing ? "Saving…" : "Create Tier"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Tier</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <TierForm data={editForm.data} setData={editForm.setData} errors={editForm.errors} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? "Saving…" : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Tier?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Delete the <strong>{deleteTarget?.tier}</strong> tier for
                        Year {deleteTarget?.year_from}{deleteTarget?.year_to != null ? `–${deleteTarget?.year_to}` : "+"} ({deleteTarget?.monthly_minutes} min)?
                        This cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={deleteForm.processing}>
                            {deleteForm.processing ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
