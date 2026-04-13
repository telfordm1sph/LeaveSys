import { useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Badge }    from "@/components/ui/badge";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle, CalendarDays, Clock,
    Paperclip, CheckCircle2, ChevronRight,
} from "lucide-react";

import FileSection  from "@/Components/Leave/FileSection";
import FileDropZone from "@/Components/Leave/FileDropZone";
import StatPill     from "@/Components/Leave/StatPill";
import { useLeaveFile } from "./hooks/useLeaveFile";
import { minutesToBalance, minutesToDays, HOURS_OPTIONS, VL_ADVANCE_DAYS, formatLeaveDate } from "@/lib/leaveUtils";

export default function File({ balances, holidays }) {
    const { emp_data } = usePage().props;

    const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);

    const {
        data, setData, processing, errors, reset,
        selected, wDays, dedMin, needAppeal, needAttach,
        unpaidMin, remMin, ready, submit,
    } = useLeaveFile(balances, holidaySet);

    const today = new Date().toISOString().slice(0, 10);

    return (
        <AuthenticatedLayout>
            <Head title="File Leave" />

            <div className="mx-auto max-w-2xl pb-12">

                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">File a Leave</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{emp_data?.emp_name}</p>
                </div>

                <form onSubmit={submit} className="space-y-3">

                    {/* 1 — Leave type */}
                    <FileSection step="1" title="Leave Type">
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
                                                    {minutesToBalance(b.balance_minutes)} bal
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leave_type && <p className="text-xs text-destructive">{errors.leave_type}</p>}

                            {selected && (
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Available Balance</p>
                                        <p className="mt-0.5 text-3xl font-extrabold tabular-nums leading-none">
                                            {minutesToDays(selected.balance_minutes)}
                                        </p>
                                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                                            {selected.balance_minutes.toLocaleString()} min &middot; {(selected.balance_minutes / 60).toFixed(2)} hrs
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="capitalize text-xs">{selected.earn_type}</Badge>
                                </div>
                            )}
                        </div>
                    </FileSection>

                    {/* 2 — Dates */}
                    <FileSection step="2" icon={CalendarDays} title="Leave Dates">
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
                                    wDays === 0
                                        ? "border-destructive/40 bg-destructive/5 text-destructive"
                                        : "bg-muted/20"
                                }`}>
                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                    {wDays === 0
                                        ? "No working days — all dates are weekends or holidays"
                                        : <><span className="text-muted-foreground">Working days:</span><span className="ml-1 font-bold">{wDays}</span></>
                                    }
                                </div>
                            )}
                        </div>
                    </FileSection>

                    {/* 3 — Hours per day */}
                    <FileSection step="3" icon={Clock} title="Hours per Day">
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
                                        <span className="absolute right-1.5 top-1.5">
                                            <CheckCircle2 className="h-3 w-3" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </FileSection>

                    {/* Deduction preview */}
                    {selected && wDays > 0 && (
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-5 py-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Deduction Preview
                                </span>
                            </div>
                            <div className="space-y-3 p-5">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <StatPill label="Working days"  value={wDays} />
                                    <StatPill label="Hrs / day"     value={`${data.hours_per_day} hrs`} />
                                    <StatPill label="Deduction"     value={`${minutesToBalance(dedMin)} bal`} sub={`${dedMin.toLocaleString()} min`} />
                                    <StatPill label="Balance after" value={`${minutesToBalance(remMin)} bal`} sub={`${remMin.toLocaleString()} min`} red={remMin < 0} green={remMin >= 0} />
                                </div>
                                {unpaidMin > 0 && (
                                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Unpaid portion: <strong>{minutesToBalance(unpaidMin)} bal ({unpaidMin.toLocaleString()} min)</strong> — exceeds current balance
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Late filing — appeal */}
                    {needAppeal && (
                        <FileSection icon={AlertTriangle} title="Late Filing — Appeal Required" accent="red">
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    VL must be filed at least <strong>{VL_ADVANCE_DAYS} days</strong> in advance.
                                    Provide a justification for the late filing. Your request will be routed for department head approval.
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

                    {/* Attachment required */}
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

                    {/* 4 — Reason */}
                    <FileSection step="4" title="Reason for Leave">
                        <Textarea placeholder="Enter your reason for leave…"
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            rows={4} />
                        {errors.reason && <p className="mt-1.5 text-xs text-destructive">{errors.reason}</p>}
                    </FileSection>

                    {/* Server error */}
                    {errors.filing && (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{errors.filing}</p>
                        </div>
                    )}

                    {/* Summary + actions */}
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        {ready && (
                            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">{selected?.label}</span>
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    {formatLeaveDate(data.date_start)}
                                    {data.date_start !== data.date_end && ` – ${formatLeaveDate(data.date_end)}`}
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    {wDays} day{wDays !== 1 ? "s" : ""}
                                    <ChevronRight className="mx-1 inline h-3.5 w-3.5 opacity-40" />
                                    <span className="font-semibold text-foreground">{minutesToBalance(dedMin)} bal deducted</span>
                                    {needAppeal && <Badge variant="destructive" className="ml-2 text-[10px]">Late + Appeal</Badge>}
                                    {needAttach && <Badge className="ml-2 bg-amber-500 text-[10px]">With Attachment</Badge>}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 px-5 py-3.5">
                            <Button type="button" variant="ghost" size="sm"
                                onClick={() => reset()} disabled={processing}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={!ready} className="min-w-32">
                                {processing    ? "Submitting…"
                                : needAppeal   ? "Submit + Appeal"
                                : needAttach   ? "Submit + Attachment"
                                : "Submit Leave"}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
