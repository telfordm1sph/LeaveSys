import { useForm } from "@inertiajs/react";
import { Button }   from "@/components/ui/button";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from "@/Components/ui/dialog";
import { fmtDate } from "@/lib/leaveRequestUtils";

// ── Shared request summary ────────────────────────────────────────────────────

function RequestSummary({ r }) {
    if (!r) return null;
    return (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-xs space-y-1">
            <p className="font-semibold text-sm">{r.employee_name}</p>
            <p className="text-muted-foreground">
                <span className="font-mono font-bold">{r.leave_type}</span>
                {" · "}{fmtDate(r.date_start)}
                {r.date_start !== r.date_end && ` – ${fmtDate(r.date_end)}`}
                {" · "}{r.working_days} day{r.working_days !== 1 ? "s" : ""}
            </p>
            {r.reason && <p className="italic text-muted-foreground">{r.reason}</p>}
        </div>
    );
}

// ── Approve dialog ────────────────────────────────────────────────────────────

export function ApproveDialog({ target, onClose }) {
    const form = useForm({ remarks: "" });

    function handleOpen(open) {
        if (!open) { form.reset(); onClose(); }
    }

    function submit(e) {
        e.preventDefault();
        form.post(route("leave.requests.approve", target.id), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    }

    return (
        <Dialog open={!!target} onOpenChange={handleOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Approval</DialogTitle>
                    <DialogDescription>Review the details below before approving.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <RequestSummary r={target} />
                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            Remarks <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                            placeholder="Add a note to your approval…"
                            value={form.data.remarks}
                            onChange={(e) => form.setData("remarks", e.target.value)}
                            rows={2}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={form.processing}>
                            {form.processing ? "Approving…" : "Confirm Approval"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

export function RejectDialog({ target, onClose }) {
    const form = useForm({ remarks: "" });

    function handleOpen(open) {
        if (!open) { form.reset(); onClose(); }
    }

    function submit(e) {
        e.preventDefault();
        form.post(route("leave.requests.reject", target.id), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    }

    return (
        <Dialog open={!!target} onOpenChange={handleOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Leave Request</DialogTitle>
                    <DialogDescription>
                        This will reject the request and refund the employee's balance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <RequestSummary r={target} />
                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            Reason for Rejection <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            placeholder="Explain why this leave is being rejected…"
                            value={form.data.remarks}
                            onChange={(e) => form.setData("remarks", e.target.value)}
                            rows={3}
                        />
                        {form.errors.remarks && (
                            <p className="text-xs text-destructive">{form.errors.remarks}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            {form.processing ? "Rejecting…" : "Reject Leave"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
