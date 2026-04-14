import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button }   from "@/components/ui/button";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from "@/Components/ui/dialog";
import { ThumbsUp, ThumbsDown, FileText, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { fmtDate, fmtMins } from "@/lib/leaveRequestUtils";
import { StatusBadge, ApproverDots } from "@/Components/Leave/RequestsTable";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImageFile(f) {
    if (f.file_type?.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp|bmp|svg|tiff?)$/i.test(f.original_file_name ?? "");
}

// ── Image lightbox ─────────────────────────────────────────────────────────────

function ImageLightbox({ url, name, onClose }) {
    const [zoom, setZoom] = useState(1);

    function handleOpenChange(open) {
        if (!open) { setZoom(1); onClose(); }
    }

    function step(delta) {
        setZoom(z => parseFloat(Math.min(4, Math.max(0.25, z + delta)).toFixed(2)));
    }

    return (
        <Dialog open={!!url} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="text-sm font-medium truncate pr-6">{name}</DialogTitle>
                    <DialogDescription className="sr-only">Image preview with zoom controls.</DialogDescription>
                </DialogHeader>

                {/* ── Image area ──────────────────────────────────────────── */}
                <div
                    className="overflow-auto flex items-center justify-center bg-muted/30"
                    style={{ maxHeight: "65vh", minHeight: "280px" }}
                >
                    <img
                        src={url}
                        alt={name}
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "center",
                            transition: "transform 0.15s ease",
                        }}
                        className="max-w-full select-none"
                        draggable={false}
                    />
                </div>

                {/* ── Zoom controls ────────────────────────────────────────── */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-t">
                    <Button
                        size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={zoom <= 0.25}
                        onClick={() => step(-0.25)}
                    >
                        <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs tabular-nums w-12 text-center font-medium">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        size="sm" variant="outline" className="h-7 w-7 p-0"
                        disabled={zoom >= 4}
                        onClick={() => step(0.25)}
                    >
                        <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0"
                        disabled={zoom === 1}
                        onClick={() => setZoom(1)}
                        title="Reset zoom"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>

                    <div className="ml-auto">
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                            <a href={url} download={name}>
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── File chip (thumbnail for images, download button for others) ──────────────

function FileChip({ f, index, label, onImageClick }) {
    const name = f.original_file_name ?? `${label} ${index + 1}`;

    if (isImageFile(f)) {
        return (
            <button
                type="button"
                onClick={() => onImageClick({ url: f.url, name })}
                className="group relative overflow-hidden rounded-md border border-border w-16 h-16 flex-shrink-0 hover:ring-2 hover:ring-primary transition-all"
                title={name}
            >
                <img src={f.url} alt={name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>
        );
    }

    return (
        <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <a href={f.url} download={name}>
                <Download className="h-3.5 w-3.5" />
                {name}
            </a>
        </Button>
    );
}

// ── Shared request summary (used by approve/reject dialogs) ──────────────────

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

// ── Detail field ──────────────────────────────────────────────────────────────

function DetailField({ label, value }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value ?? "—"}</p>
        </div>
    );
}

// ── Leave Details Modal ───────────────────────────────────────────────────────

export function LeaveDetailsModal({ target, onClose, onApprove, onReject }) {
    const [selectedImage, setSelectedImage] = useState(null);

    const r = target;
    const showActions = !!(onApprove && onReject);
    const isAppeal = !!r?.with_appeal;
    const appealFiles = r?.appeal_files ?? [];
    const attachmentFiles = r?.attachment_files ?? [];

    function handleClose() {
        setSelectedImage(null);
        onClose();
    }

    if (!r) return null;

    const approvers = [...(r.approvers ?? [])].sort(
        (a, b) => a.approver_level - b.approver_level
    );

    function ordinal(n) {
        if (n === 1) return "1st";
        if (n === 2) return "2nd";
        if (n === 3) return "3rd";
        return `${n}th`;
    }

    function fmtDateTime(dt) {
        if (!dt) return null;
        return new Date(dt).toLocaleString("en-PH", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    }

    return (
        <>
            <Dialog open={!!target} onOpenChange={(open) => { if (!open) handleClose(); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <DialogTitle>Leave Details</DialogTitle>
                            <StatusBadge status={r.status} />
                        </div>
                        <DialogDescription className="sr-only">
                            Full details for this leave request.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* ── Row 1 ───────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 rounded-lg border bg-muted/20 px-4 py-3">
                            {r.employee_name && (
                                <DetailField label="Employee No." value={r.employid} />
                            )}
                            {r.employee_name && (
                                <DetailField label="Employee Name" value={r.employee_name} />
                            )}
                            <DetailField label="Date Posted" value={fmtDate(r.date_posted)} />
                            <DetailField label="Leave App No." value={`#${r.id}`} />
                            <DetailField label="Leave Type" value={r.leave_type} />
                            <DetailField label="Effective Date" value={fmtDate(r.date_start)} />
                        </div>

                        {/* ── Row 2 ───────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 rounded-lg border bg-muted/20 px-4 py-3">
                            <DetailField
                                label="Duration"
                                value={`${r.working_days} day${r.working_days !== 1 ? "s" : ""} (${fmtMins(r.paid_minutes + (r.unpaid_minutes ?? 0))})`}
                            />
                            <DetailField
                                label="With Pay"
                                value={r.paid_minutes > 0 ? fmtMins(r.paid_minutes) : "—"}
                            />
                            <DetailField
                                label="Without Pay"
                                value={r.unpaid_minutes > 0 ? fmtMins(r.unpaid_minutes) : "—"}
                            />
                            {approvers.map((a) => (
                                <div key={a.id} className="space-y-0.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {ordinal(a.approver_level)} Approver
                                        {a.decided_at && (
                                            <span className="normal-case ml-1 opacity-60">
                                                ({fmtDateTime(a.decided_at)})
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium">
                                            {a.approver_name ?? `#${a.approver_employid}`}
                                        </p>
                                        <ApproverDots approvers={[a]} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Reason ──────────────────────────────────────────── */}
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-0.5">Reason</p>
                            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm min-h-[60px]">
                                {r.reason || <span className="text-muted-foreground italic">No reason provided.</span>}
                            </div>
                        </div>

                        {/* ── Appeal files ────────────────────────────────────── */}
                        {isAppeal && appealFiles.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-0.5">
                                    Appeal File{appealFiles.length > 1 ? "s" : ""}
                                </p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {appealFiles.map((f, i) => (
                                        <FileChip
                                            key={f.id ?? i}
                                            f={f}
                                            index={i}
                                            label="Appeal File"
                                            onImageClick={setSelectedImage}
                                        />
                                    ))}
                                </div>
                                {appealFiles[0]?.reason && (
                                    <p className="text-xs text-muted-foreground italic px-0.5">
                                        Appeal reason: {appealFiles[0].reason}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Attachment files ─────────────────────────────────── */}
                        {attachmentFiles.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-0.5">
                                    Attachment{attachmentFiles.length > 1 ? "s" : ""}
                                </p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {attachmentFiles.map((f, i) => (
                                        <FileChip
                                            key={f.id ?? i}
                                            f={f}
                                            index={i}
                                            label="Attachment"
                                            onImageClick={setSelectedImage}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {showActions && (
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                                onClick={() => onReject(r)}
                            >
                                <ThumbsDown className="h-3.5 w-3.5" /> Reject
                            </Button>
                            <Button
                                type="button"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => onApprove(r)}
                            >
                                <ThumbsUp className="h-3.5 w-3.5" /> Approve
                            </Button>
                        </DialogFooter>
                    )}

                    {!showActions && (
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleClose}>Close</Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <ImageLightbox
                url={selectedImage?.url}
                name={selectedImage?.name}
                onClose={() => setSelectedImage(null)}
            />
        </>
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
