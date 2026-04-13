import { useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Badge }     from "@/components/ui/badge";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/Components/ui/date-picker";
import {
    AlertTriangle, CalendarDays, CheckCircle2,
    ChevronRight, Paperclip, Clock,
} from "lucide-react";

import FileSection  from "@/Components/Leave/FileSection";
import FileDropZone from "@/Components/Leave/FileDropZone";
import { useLeaveFile } from "./hooks/useLeaveFile";
import {
    minutesToBalance, minutesToDays,
    DURATION_OPTIONS, HOURS_OPTIONS,
    VL_ADVANCE_DAYS, formatLeaveDate,
} from "@/lib/leaveUtils";

export default function File({ balances, holidays }) {
    const { emp_data } = usePage().props;

    const holidaySet = useMemo(
        () => new Set(holidays.map((h) => h.date)),
        [holidays],
    );

    const {
        data, setData, processing, errors, reset,
        selected, wDays, minsPerDay, dedMin, needAppeal, needAttach,
        unpaidMin, remMin, ready, submit,
    } = useLeaveFile(balances, holidaySet);

    return (
        <AuthenticatedLayout>
            <Head title="File Leave" />

            <div className="mx-auto max-w-3xl pb-12">

                {/* Page header */}
                <div className="mb-5 flex items-baseline justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">File a Leave</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{emp_data?.emp_name}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-3">

                    {/* ── Row 1: Type + Dates ──────────────────────────────── */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            {/* Leave type */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Leave Type</Label>
                                <Select value={data.leave_type} onValueChange={(v) => setData("leave_type", v)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {balances.map((b) => (
                                            <SelectItem key={b.leave_type} value={b.leave_type}>
                                                <div className="flex items-center gap-2">
                                                    <span>{b.label}</span>
                                                    <Badge variant="outline" className="text-[10px] tabular-nums">
                                                        {minutesToBalance(b.balance_minutes)}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.leave_type && <p className="text-xs text-destructive">{errors.leave_type}</p>}
                            </div>

                            {/* Date start */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date Start</Label>
                                <DatePicker
                                    value={data.date_start}
                                    placeholder="Start date"
                                    clearable={false}
                                    onChange={(v) => {
                                        setData("date_start", v ?? "");
                                        if (!data.date_end || data.date_end < v)
                                            setData("date_end", v ?? "");
                                    }}
                                />
                                {errors.date_start && <p className="text-xs text-destructive">{errors.date_start}</p>}
                            </div>

                            {/* Date end */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date End</Label>
                                <DatePicker
                                    value={data.date_end}
                                    placeholder="End date"
                                    clearable={false}
                                    onChange={(v) => setData("date_end", v ?? "")}
                                />
                                {errors.date_end && <p className="text-xs text-destructive">{errors.date_end}</p>}
                            </div>
                        </div>

                        {/* Balance + working days — shown once type & dates chosen */}
                        {(selected || (data.date_start && data.date_end)) && (
                            <div className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-2.5">
                                {selected && (
                                    <>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
                                            <p className="text-xl font-extrabold tabular-nums leading-none">
                                                {minutesToDays(selected.balance_minutes)}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {selected.balance_minutes.toLocaleString()} min
                                            &nbsp;·&nbsp;{(selected.balance_minutes / 60).toFixed(1)} hrs
                                        </div>
                                        <Badge variant="secondary" className="capitalize text-xs">{selected.earn_type}</Badge>
                                        <div className="ml-auto w-px h-6 bg-border" />
                                    </>
                                )}
                                {data.date_start && data.date_end && (
                                    <div className={`flex items-center gap-2 text-sm ${wDays === 0 ? "text-destructive" : "text-foreground"} ${!selected ? "ml-auto" : ""}`}>
                                        <CalendarDays className="h-4 w-4 shrink-0" />
                                        {wDays === 0
                                            ? "No working days in range"
                                            : <><span className="text-muted-foreground">Working days:</span><span className="ml-1 font-bold">{wDays}</span></>
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Row 2: Duration ──────────────────────────────────── */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Duration
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Hours per day */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground mr-1">hrs/day:</span>
                                {HOURS_OPTIONS.map((h) => (
                                    <button key={h} type="button"
                                        onClick={() => setData("hours_per_day", String(h))}
                                        className={`relative h-8 w-14 rounded-lg border text-sm font-semibold transition-all ${
                                            data.hours_per_day === String(h)
                                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                : "border-border bg-card hover:bg-muted"
                                        }`}>
                                        {h}h
                                        {data.hours_per_day === String(h) && (
                                            <span className="absolute right-1 top-1">
                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-border" />

                            {/* Whole / Half */}
                            <div className="flex items-center gap-1.5 flex-1">
                                {DURATION_OPTIONS.map((opt) => {
                                    const h = parseInt(data.hours_per_day, 10) || 8;
                                    const effectiveHrs = opt.value === "half" ? h / 2 : h;
                                    return (
                                        <button key={opt.value} type="button"
                                            onClick={() => setData("duration", opt.value)}
                                            className={`relative flex-1 h-10 rounded-lg border px-3 text-left transition-all ${
                                                data.duration === opt.value
                                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                    : "border-border bg-card hover:bg-muted"
                                            }`}>
                                            <span className="text-sm font-semibold">{opt.label}</span>
                                            <span className={`ml-2 text-xs ${data.duration === opt.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                {effectiveHrs}h · {effectiveHrs * 60}min
                                            </span>
                                            {data.duration === opt.value && (
                                                <span className="absolute right-2 top-2">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {data.duration === "half" && wDays > 1 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Half day is typically for a single day. {wDays} days selected — each day deducts {parseInt(data.hours_per_day) / 2}h ({minsPerDay}min).
                            </p>
                        )}
                    </div>

                    {/* ── Deduction preview ────────────────────────────────── */}
                    {selected && wDays > 0 && (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="grid grid-cols-4 divide-x divide-border">
                                {[
                                    { label: "Working days",  value: wDays,                             sub: null },
                                    { label: "Per day",       value: `${minsPerDay / 60}h`,             sub: `${minsPerDay}min` },
                                    { label: "Deduction",     value: minutesToBalance(dedMin),           sub: `${dedMin.toLocaleString()}min` },
                                    {
                                        label: "Balance after",
                                        value: minutesToBalance(remMin),
                                        sub:   `${remMin.toLocaleString()}min`,
                                        red:   remMin < 0,
                                        green: remMin >= 0,
                                    },
                                ].map((s) => (
                                    <div key={s.label} className="px-4 py-3 text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                                        <p className={`mt-0.5 text-lg font-bold tabular-nums leading-none ${s.red ? "text-destructive" : s.green ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                                            {s.value}
                                        </p>
                                        {s.sub && <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">{s.sub}</p>}
                                    </div>
                                ))}
                            </div>
                            {unpaidMin > 0 && (
                                <div className="flex items-center gap-2 border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    Unpaid portion: <strong>{minutesToBalance(unpaidMin)} ({unpaidMin.toLocaleString()}min)</strong> — exceeds current balance
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Reason ───────────────────────────────────────────── */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Reason for Leave
                        </Label>
                        <Textarea
                            placeholder="Enter your reason for leave…"
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            rows={3}
                        />
                        {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
                    </div>

                    {/* ── Late filing appeal ───────────────────────────────── */}
                    {needAppeal && (
                        <FileSection icon={AlertTriangle} title="Late Filing — Appeal Required" accent="red">
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    VL must be filed at least <strong>{VL_ADVANCE_DAYS} days</strong> in advance.
                                    Provide a justification — your request will be routed for department head approval.
                                </p>
                                <div className="space-y-1.5">
                                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
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
                        </FileSection>
                    )}

                    {/* ── Attachment required ──────────────────────────────── */}
                    {needAttach && (
                        <FileSection icon={Paperclip} title="Supporting Document Required" accent="amber">
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
                        </FileSection>
                    )}

                    {/* ── Server error ─────────────────────────────────────── */}
                    {errors.filing && (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{errors.filing}</p>
                        </div>
                    )}

                    {/* ── Summary + submit ─────────────────────────────────── */}
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        {ready && (
                            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <p className="text-sm text-muted-foreground truncate">
                                    <span className="font-semibold text-foreground">{selected?.label}</span>
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    {formatLeaveDate(data.date_start)}
                                    {data.date_start !== data.date_end && ` – ${formatLeaveDate(data.date_end)}`}
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    {wDays} day{wDays !== 1 ? "s" : ""} ({data.duration === "half" ? "half" : "whole"})
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    <span className="font-semibold text-foreground">{minutesToBalance(dedMin)} deducted</span>
                                    {needAppeal && <Badge variant="destructive" className="ml-2 text-[10px]">Late + Appeal</Badge>}
                                    {needAttach && <Badge className="ml-2 bg-amber-500 text-[10px]">With Attachment</Badge>}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 px-5 py-3">
                            <Button type="button" variant="ghost" size="sm" onClick={() => reset()} disabled={processing}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={!ready} className="min-w-32">
                                {processing  ? "Submitting…"
                                : needAppeal ? "Submit + Appeal"
                                : needAttach ? "Submit + Attachment"
                                : "Submit Leave"}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
