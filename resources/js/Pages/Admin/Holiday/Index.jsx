import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { Badge }   from "@/Components/ui/badge";
import { Button }  from "@/Components/ui/button";
import { Input }   from "@/Components/ui/input";
import { Label }   from "@/Components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/Components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const HOLIDAY_TYPES = [
    { value: "regular", label: "Regular (National)" },
    { value: "special", label: "Special Non-Working" },
    { value: "company", label: "Company Day-Off" },
];

const TYPE_COLORS = {
    regular: "default",
    special: "secondary",
    company: "outline",
};

function HolidayForm({ data, setData, errors }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={data.holiday_date}
                        onChange={e => setData("holiday_date", e.target.value)} />
                    {errors.holiday_date && <p className="text-xs text-destructive">{errors.holiday_date}</p>}
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                    <Select value={data.type} onValueChange={v => setData("type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {HOLIDAY_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                <Input value={data.name} onChange={e => setData("name", e.target.value)}
                    placeholder="e.g. Araw ng Kagitingan" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="is_paid" className="h-4 w-4 accent-primary"
                    checked={!!data.is_paid} onChange={e => setData("is_paid", e.target.checked)} />
                <Label htmlFor="is_paid" className="text-xs cursor-pointer">Paid holiday</Label>
            </div>
        </div>
    );
}

const blank = { holiday_date: "", name: "", type: "regular", is_paid: true };

export default function Index({ holidays, year, available_years }) {
    const { flash } = usePage().props;

    const [showAdd, setShowAdd]         = useState(false);
    const [editTarget, setEditTarget]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const addForm    = useForm({ ...blank });
    const editForm   = useForm({ ...blank });
    const deleteForm = useForm({});

    function changeYear(y) {
        router.get(route("admin.leave.holidays"), { year: y }, { preserveState: false });
    }

    function submitAdd(e) {
        e.preventDefault();
        addForm.post(route("admin.leave.holidays.store"), {
            onSuccess: () => { setShowAdd(false); addForm.reset(); },
        });
    }

    function openEdit(h) {
        setEditTarget(h);
        editForm.setData({
            holiday_date: h.holiday_date,
            name:         h.name,
            type:         h.type,
            is_paid:      !!h.is_paid,
        });
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.patch(route("admin.leave.holidays.update", editTarget.id), {
            onSuccess: () => setEditTarget(null),
        });
    }

    function submitDelete() {
        deleteForm.delete(route("admin.leave.holidays.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const allYears = Array.from(new Set([
        ...available_years,
        new Date().getFullYear(),
        new Date().getFullYear() + 1,
    ])).sort((a, b) => b - a);

    return (
        <AuthenticatedLayout>
            <Head title="Holidays" />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold">Holidays</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Non-working dates used in working-day calculations.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Year picker */}
                        <Select value={String(year)} onValueChange={v => changeYear(v)}>
                            <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allYears.map(y => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => setShowAdd(true)}>
                            <Plus className="h-4 w-4 mr-1.5" /> Add Holiday
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/20">
                        <span className="text-sm font-semibold">{year} — {holidays.total} holidays</span>
                        <span className="text-xs text-muted-foreground">
                            Page {holidays.current_page} / {holidays.last_page}
                        </span>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3 text-center">Paid</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {holidays.data.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                    No holidays for {year}. Add the first one.
                                </td></tr>
                            )}
                            {holidays.data.map(h => (
                                <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">{h.holiday_date}</td>
                                    <td className="px-4 py-3 font-medium">{h.name}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={TYPE_COLORS[h.type] ?? "outline"} className="capitalize text-[10px]">
                                            {h.type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">
                                        {h.is_paid
                                            ? <span className="text-emerald-600 font-semibold">Yes</span>
                                            : <span className="text-muted-foreground">No</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(h)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteTarget(h)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {holidays.last_page > 1 && (
                        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                disabled={holidays.current_page <= 1}
                                onClick={() => router.get(holidays.prev_page_url)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                {holidays.current_page} / {holidays.last_page}
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                                disabled={holidays.current_page >= holidays.last_page}
                                onClick={() => router.get(holidays.next_page_url)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        <HolidayForm data={addForm.data} setData={addForm.setData} errors={addForm.errors} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button type="submit" disabled={addForm.processing}>
                                {addForm.processing ? "Saving…" : "Add Holiday"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Holiday</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <HolidayForm data={editForm.data} setData={editForm.setData} errors={editForm.errors} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? "Saving…" : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Holiday?</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.holiday_date})?
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
