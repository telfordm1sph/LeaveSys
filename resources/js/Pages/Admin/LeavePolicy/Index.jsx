import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Badge }     from "@/Components/ui/badge";
import { Button }    from "@/Components/ui/button";
import { Input }     from "@/Components/ui/input";
import { Label }     from "@/Components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Plus, Pencil, Power } from "lucide-react";

const EARN_TYPES   = ["monthly", "yearly", "event"];
const HIRE_TIERS   = ["all", "new", "legacy"];

function PolicyForm({ data, setData, errors, isEdit = false }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Leave Type Code <span className="text-destructive">*</span></Label>
                    <Input value={data.leave_type} onChange={e => setData("leave_type", e.target.value.toUpperCase())}
                        placeholder="e.g. VL, SL, BL" maxLength={20} />
                    {errors.leave_type && <p className="text-xs text-destructive">{errors.leave_type}</p>}
                </div>
            )}
            <div className="col-span-2 space-y-1">
                <Label className="text-xs">Label <span className="text-destructive">*</span></Label>
                <Input value={data.label} onChange={e => setData("label", e.target.value)} placeholder="Vacation Leave" />
                {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Earn Type</Label>
                <Select value={data.earn_type} onValueChange={v => setData("earn_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {EARN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Applies To</Label>
                <Select value={data.applies_to_hire_tier} onValueChange={v => setData("applies_to_hire_tier", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {HIRE_TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Yearly Grant (minutes)</Label>
                <Input type="number" min="0" value={data.yearly_grant_minutes ?? ""}
                    onChange={e => setData("yearly_grant_minutes", e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="e.g. 3360 = 7 days" />
                <p className="text-[10px] text-muted-foreground">Leave blank for monthly types</p>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Cash Rate / Day (₱)</Label>
                <Input type="number" min="0" step="0.01" value={data.cash_rate_per_day}
                    onChange={e => setData("cash_rate_per_day", e.target.value)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max Carryover Days</Label>
                <Input type="number" min="0" value={data.max_carryover_days}
                    onChange={e => setData("max_carryover_days", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Max Convertible Days</Label>
                <Input type="number" min="0" value={data.max_convertible_days}
                    onChange={e => setData("max_convertible_days", parseInt(e.target.value) || 0)} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="is_convertible" className="h-4 w-4 accent-primary"
                    checked={!!data.is_convertible}
                    onChange={e => setData("is_convertible", e.target.checked)} />
                <Label htmlFor="is_convertible" className="text-xs cursor-pointer">Convertible to cash at year-end</Label>
            </div>
        </div>
    );
}

function blankForm() {
    return {
        leave_type: "", label: "", earn_type: "monthly",
        yearly_grant_minutes: null, applies_to_hire_tier: "all",
        is_convertible: false, max_carryover_days: 0,
        max_convertible_days: 0, cash_rate_per_day: "0.00",
    };
}

export default function Index({ policies }) {
    const { flash } = usePage().props;

    // ── Add modal ──────────────────────────────────────────────────
    const [showAdd, setShowAdd] = useState(false);
    const addForm = useForm(blankForm());

    function submitAdd(e) {
        e.preventDefault();
        addForm.post(route("admin.leave.policy.store"), {
            onSuccess: () => { setShowAdd(false); addForm.reset(); },
        });
    }

    // ── Edit modal ─────────────────────────────────────────────────
    const [editTarget, setEditTarget] = useState(null);
    const editForm = useForm(blankForm());

    function openEdit(policy) {
        setEditTarget(policy);
        editForm.setData({
            label:                policy.label,
            earn_type:            policy.earn_type,
            yearly_grant_minutes: policy.yearly_grant_minutes,
            applies_to_hire_tier: policy.applies_to_hire_tier,
            is_convertible:       !!policy.is_convertible,
            max_carryover_days:   policy.max_carryover_days,
            max_convertible_days: policy.max_convertible_days,
            cash_rate_per_day:    policy.cash_rate_per_day,
        });
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.patch(route("admin.leave.policy.update", editTarget.id), {
            onSuccess: () => setEditTarget(null),
        });
    }

    function toggleActive(policy) {
        useForm({}).patch(route("admin.leave.policy.toggle", policy.id));
    }

    // ── Inertia patch helper for toggle (no useForm hook inside handler) ──
    const toggleForm = useForm({});
    function handleToggle(policy) {
        toggleForm.patch(route("admin.leave.policy.toggle", policy.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Leave Policy" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Leave Policy</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Master rules for all leave types. Changes take effect immediately.
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add Policy
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                {/* Table */}
                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Label</th>
                                    <th className="px-4 py-3">Earn</th>
                                    <th className="px-4 py-3">Applies To</th>
                                    <th className="px-4 py-3 text-right">Yearly Grant</th>
                                    <th className="px-4 py-3 text-right">Carryover</th>
                                    <th className="px-4 py-3 text-right">Convertible</th>
                                    <th className="px-4 py-3 text-right">Cash Rate</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {policies.map(p => (
                                    <tr key={p.id} className={`transition-colors hover:bg-muted/20 ${!p.is_active ? "opacity-50" : ""}`}>
                                        <td className="px-4 py-3 font-mono font-semibold text-xs">{p.leave_type}</td>
                                        <td className="px-4 py-3 font-medium">{p.label}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="capitalize text-[10px]">{p.earn_type}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="capitalize text-[10px]">{p.applies_to_hire_tier}</Badge>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-right text-xs text-muted-foreground">
                                            {p.yearly_grant_minutes != null
                                                ? `${p.yearly_grant_minutes} min (${(p.yearly_grant_minutes / 480).toFixed(1)} d)`
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-right text-xs">{p.max_carryover_days}d</td>
                                        <td className="px-4 py-3 text-center text-xs">
                                            {p.is_convertible
                                                ? <span className="text-emerald-600 font-semibold">Yes</span>
                                                : <span className="text-muted-foreground">No</span>}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-right text-xs">₱{Number(p.cash_rate_per_day).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                                                {p.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost"
                                                    className={`h-7 w-7 ${p.is_active ? "text-destructive hover:text-destructive" : "text-emerald-600 hover:text-emerald-600"}`}
                                                    onClick={() => handleToggle(p)}
                                                    disabled={toggleForm.processing}>
                                                    <Power className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Leave Policy</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <PolicyForm data={addForm.data} setData={addForm.setData} errors={addForm.errors} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button type="submit" disabled={addForm.processing}>
                                {addForm.processing ? "Saving…" : "Create Policy"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit — {editTarget?.leave_type}: {editTarget?.label}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <PolicyForm data={editForm.data} setData={editForm.setData} errors={editForm.errors} isEdit />
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
