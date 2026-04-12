import { useMemo, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Badge }    from "@/components/ui/badge";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator }from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle, CalendarDays, Clock, Paperclip,
    X, FileText, CheckCircle2, ChevronRight,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS_OPTIONS    = [8, 10, 12];
const VL_ADVANCE_DAYS  = 2;
const APPEAL_TYPES     = ["VL"];
const ATTACHMENT_TYPES = ["EL", "BEREAVEMENT"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bal(minutes) {
    const v = (parseInt(minutes, 10) || 0) / 480;
    return parseFloat(v.toFixed(4)).toString();
}

function countWorkingDays(s, e, hols) {
    if (!s || !e) return 0;
    const cur = new Date(s + "T12:00:00");
    const end = new Date(e + "T12:00:00");
    let n = 0;
    while (cur <= end) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6 && !hols.has(cur.toISOString().slice(0, 10))) n++;
        cur.setDate(cur.getDate() + 1);
    }
    return n;
}

function isLate(type, start) {
    if (!type || !start || !APPEAL_TYPES.includes(type)) return false;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(start + "T00:00:00") - t) / 86400000) < VL_ADVANCE_DAYS;
}

function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
    });
}

function fmtSize(b) {
    if (b < 1024)    return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ step, icon: Icon, title, children, accent }) {
    const border = accent === "red"    ? "border-l-destructive"
                 : accent === "amber"  ? "border-l-amber-400"
                 : "border-l-border";
    return (
        <div className={`rounded-xl border border-border border-l-4 ${border} bg-card shadow-sm`}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                {step && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {step}
                    </span>
                )}
                {Icon && !step && (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        accent === "red"   ? "bg-destructive/10" :
                        accent === "amber" ? "bg-amber-400/10"   : "bg-muted"
                    }`}>
                        <Icon className={`h-3.5 w-3.5 ${
                            accent === "red"   ? "text-destructive" :
                            accent === "amber" ? "text-amber-500"   : "text-muted-foreground"
                        }`} />
                    </span>
                )}
                <h3 className={`text-sm font-semibold ${
                    accent === "red"   ? "text-destructive" :
                    accent === "amber" ? "text-amber-600 dark:text-amber-400" :
                    "text-foreground"
                }`}>
                    {title}
                </h3>
            </div>
            <div className="px-5 py-4">
                {children}
            </div>
        </div>
    );
}

// ─── File drop zone ───────────────────────────────────────────────────────────

function FileDropZone({ label, hint, files, onChange, error }) {
    const ref = useRef(null);

    const add   = (f) => onChange([...files, ...f]);
    const del   = (i) => onChange(files.filter((_, j) => j !== i));
    const pick  = (e) => { add(Array.from(e.target.files)); e.target.value = ""; };
    const drop  = (e) => { e.preventDefault(); add(Array.from(e.dataTransfer.files)); };

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>}
            {hint  && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={drop}
                onClick={() => ref.current?.click()}
                className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-muted/20 px-4 py-6 transition-all hover:border-primary hover:bg-primary/5"
            >
                <div className="rounded-full bg-muted p-2 group-hover:bg-primary/10 transition-colors">
                    <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Drop files or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG — max 10 MB each</p>
                <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden" onChange={pick} />
            </div>

            {files.length > 0 && (
                <ul className="space-y-1">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{fmtSize(f.size)}</span>
                            <button type="button" onClick={() => del(i)}
                                className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ─── Deduction pill row ───────────────────────────────────────────────────────

function StatPill({ label, value, sub, red, green }) {
    return (
        <div className={`flex flex-col rounded-lg border px-4 py-3 ${
            red   ? "border-destructive/30 bg-destructive/5" :
            green ? "border-emerald-400/30 bg-emerald-400/5" :
            "bg-muted/30"
        }`}>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className={`text-lg font-bold tabular-nums leading-tight ${
                red ? "text-destructive" : green ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            }`}>
                {value}
            </span>
            {sub && <span className="text-[10px] text-muted-foreground tabular-nums">{sub}</span>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function File({ balances, holidays }) {
    const { emp_data } = usePage().props;

    const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);

    const { data, setData, post, processing, errors, reset } = useForm({
        leave_type:       "",
        date_start:       "",
        date_end:         "",
        hours_per_day:    "8",
        reason:           "",
        appeal_reason:    "",
        appeal_files:     [],
        attachment_files: [],
    });

    const selected  = useMemo(() => balances.find((b) => b.leave_type === data.leave_type) ?? null, [balances, data.leave_type]);
    const wDays     = useMemo(() => countWorkingDays(data.date_start, data.date_end, holidaySet), [data.date_start, data.date_end, holidaySet]);
    const dedMin    = wDays * parseInt(data.hours_per_day, 10) * 60;
    const late      = isLate(data.leave_type, data.date_start);
    const needAppeal= late && APPEAL_TYPES.includes(data.leave_type);
    const needAttach= ATTACHMENT_TYPES.includes(data.leave_type);
    const today     = new Date().toISOString().slice(0, 10);

    const curMin    = parseInt(selected?.balance_minutes, 10) || 0;
    const paidMin   = Math.min(dedMin, curMin);
    const unpaidMin = dedMin - paidMin;
    const remMin    = curMin - paidMin;

    const ready =
        !!data.leave_type && !!data.date_start && !!data.date_end &&
        wDays > 0 && data.reason.trim() &&
        (!needAppeal || data.appeal_reason.trim()) && !processing;

    function submit(e) {
        e.preventDefault();
        post(route("leave.file.store"), { forceFormData: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="File Leave" />

            <div className="mx-auto max-w-2xl pb-12">

                {/* ── Page header ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">File a Leave</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{emp_data?.emp_name}</p>
                </div>

                <form onSubmit={submit} className="space-y-3">

                    {/* ── 1. Leave type ── */}
                    <Section step="1" title="Leave Type">
                        <div className="space-y-3">
                            <Select value={data.leave_type} onValueChange={(v) => setData("leave_type", v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select leave type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {balances.map((b) => (
                                        <SelectItem key={b.leave_type} value={b.leave_type}>
                                            <div className="flex items-center gap-2">
                                                <span>{b.label}</span>
                                                <Badge variant="outline" className="text-[10px] tabular-nums">
                                                    {bal(b.balance_minutes)} bal
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leave_type && <p className="text-xs text-destructive">{errors.leave_type}</p>}

                            {/* Balance display */}
                            {selected && (
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Available Balance</p>
                                        <p className="text-3xl font-extrabold tabular-nums leading-none mt-0.5">
                                            {bal(selected.balance_minutes)}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                                            {selected.balance_minutes.toLocaleString()} min &middot; {(selected.balance_minutes / 60).toFixed(2)} hrs
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="capitalize text-xs">{selected.earn_type}</Badge>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* ── 2. Dates ── */}
                    <Section step="2" icon={CalendarDays} title="Leave Dates">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Date Start</Label>
                                    <Input type="date" value={data.date_start}
                                        onChange={(e) => {
                                            setData("date_start", e.target.value);
                                            if (!data.date_end || data.date_end < e.target.value)
                                                setData("date_end", e.target.value);
                                        }} />
                                    {errors.date_start && <p className="text-xs text-destructive">{errors.date_start}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Date End</Label>
                                    <Input type="date" min={data.date_start || today}
                                        value={data.date_end}
                                        onChange={(e) => setData("date_end", e.target.value)} />
                                    {errors.date_end && <p className="text-xs text-destructive">{errors.date_end}</p>}
                                </div>
                            </div>

                            {data.date_start && data.date_end && (
                                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                    wDays === 0 ? "border-destructive/40 bg-destructive/5 text-destructive" : "bg-muted/20"
                                }`}>
                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                    {wDays === 0
                                        ? "No working days — all dates are weekends or holidays"
                                        : <><span className="text-muted-foreground">Working days:</span><span className="font-bold ml-1">{wDays}</span></>
                                    }
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* ── 3. Hours per day ── */}
                    <Section step="3" icon={Clock} title="Hours per Day">
                        <div className="grid grid-cols-3 gap-2">
                            {HOURS_OPTIONS.map((h) => (
                                <button key={h} type="button"
                                    onClick={() => setData("hours_per_day", String(h))}
                                    className={`relative rounded-lg border py-3.5 text-sm font-semibold transition-all ${
                                        data.hours_per_day === String(h)
                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                            : "border-border bg-card hover:bg-muted"
                                    }`}>
                                    {h} hrs
                                    {data.hours_per_day === String(h) && (
                                        <span className="absolute top-1.5 right-1.5">
                                            <CheckCircle2 className="h-3 w-3" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {/* ── Deduction preview (appears once dates + type are set) ── */}
                    {selected && wDays > 0 && (
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Deduction Preview
                                </span>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <StatPill label="Working days" value={wDays} />
                                    <StatPill label="Hrs / day"    value={`${data.hours_per_day} hrs`} />
                                    <StatPill label="Deduction"    value={`${bal(dedMin)} bal`}    sub={`${dedMin.toLocaleString()} min`} />
                                    <StatPill label="Balance after" value={`${bal(remMin)} bal`}   sub={`${remMin.toLocaleString()} min`} red={remMin < 0} green={remMin >= 0} />
                                </div>
                                {unpaidMin > 0 && (
                                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Unpaid portion: <strong>{bal(unpaidMin)} bal ({unpaidMin.toLocaleString()} min)</strong> — exceeds current balance
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Late filing → appeal inline ── */}
                    {needAppeal && (
                        <Section icon={AlertTriangle} title="Late Filing — Appeal Required" accent="red">
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    VL must be filed at least <strong>{VL_ADVANCE_DAYS} days</strong> in advance.
                                    Provide a justification for the late filing. Your request will be routed for department head approval.
                                </p>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Appeal Justification <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea placeholder="Why was this leave filed late?"
                                        value={data.appeal_reason}
                                        onChange={(e) => setData("appeal_reason", e.target.value)}
                                        rows={3} />
                                    {errors.appeal_reason && <p className="text-xs text-destructive">{errors.appeal_reason}</p>}
                                </div>
                                <Separator />
                                <FileDropZone
                                    label="Supporting Files"
                                    hint="Optional — attach any supporting documents for your appeal."
                                    files={data.appeal_files}
                                    onChange={(f) => setData("appeal_files", f)}
                                    error={errors["appeal_files.0"]}
                                />
                            </div>
                        </Section>
                    )}

                    {/* ── Attachment required ── */}
                    {needAttach && (
                        <Section icon={Paperclip} title="Supporting Document Required" accent="amber">
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {data.leave_type === "EL"
                                        ? "Emergency Leave requires a supporting document (e.g. medical certificate or incident report)."
                                        : "Bereavement Leave requires a supporting document (e.g. death certificate or funeral notice)."}
                                </p>
                                <FileDropZone
                                    files={data.attachment_files}
                                    onChange={(f) => setData("attachment_files", f)}
                                    error={errors["attachment_files.0"]}
                                />
                            </div>
                        </Section>
                    )}

                    {/* ── 4. Reason ── */}
                    <Section step="4" title="Reason for Leave">
                        <Textarea placeholder="Enter your reason for leave…"
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            rows={4} />
                        {errors.reason && <p className="mt-1.5 text-xs text-destructive">{errors.reason}</p>}
                    </Section>

                    {/* ── Server error ── */}
                    {errors.filing && (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{errors.filing}</p>
                        </div>
                    )}

                    {/* ── Summary + actions ── */}
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        {ready && (
                            <>
                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">{selected?.label}</span>
                                        <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-40" />
                                        {fmtDate(data.date_start)}{data.date_start !== data.date_end && ` – ${fmtDate(data.date_end)}`}
                                        <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-40" />
                                        {wDays} day{wDays !== 1 ? "s" : ""}
                                        <ChevronRight className="inline h-3.5 w-3.5 mx-1 opacity-40" />
                                        <span className="font-semibold text-foreground">{bal(dedMin)} bal deducted</span>
                                        {needAppeal  && <Badge variant="destructive" className="ml-2 text-[10px]">Late + Appeal</Badge>}
                                        {needAttach  && <Badge className="ml-2 text-[10px] bg-amber-500">With Attachment</Badge>}
                                    </p>
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-end gap-2 px-5 py-3.5">
                            <Button type="button" variant="ghost" size="sm"
                                onClick={() => reset()} disabled={processing}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={!ready} className="min-w-32">
                                {processing
                                    ? "Submitting…"
                                    : needAppeal  ? "Submit + Appeal"
                                    : needAttach  ? "Submit + Attachment"
                                    : "Submit Leave"}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
