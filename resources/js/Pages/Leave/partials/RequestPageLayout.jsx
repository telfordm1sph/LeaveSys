import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import {
    Search, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { RequestsTable, SectionLabel } from "@/Components/Leave/RequestsTable";
import { useRequestPage } from "../hooks/useRequestPage";

// ── Pagination ────────────────────────────────────────────────────────────────

export function Pagination({ current, last, onPageChange }) {
    if (last <= 1) return null;
    return (
        <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                disabled={current === 1} onClick={() => onPageChange(1)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                disabled={current === 1} onClick={() => onPageChange(current - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
                <strong>{current}</strong> / <strong>{last}</strong>
            </span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                disabled={current === last} onClick={() => onPageChange(current + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                disabled={current === last} onClick={() => onPageChange(last)}>
                <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RequestPageLayout({ title, routeName, myRequests, tab, search }) {
    const { searchInput, setSearchInput, changeTab, changePage, doSearch } =
        useRequestPage({ routeName, tab, search });

    const rows = myRequests.data ?? [];

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="space-y-4">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-bold flex-1">{title}</h1>

                    <div className="flex items-center gap-1.5">
                        <Input
                            className="h-8 w-52 text-sm"
                            placeholder="Search type or reason…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && doSearch()}
                        />
                        <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={doSearch}>
                            <Search className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                        <button onClick={() => changeTab("pending")}
                            className={`px-4 py-1.5 transition-colors ${tab === "pending" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                            Pending
                        </button>
                        <button onClick={() => changeTab("history")}
                            className={`px-4 py-1.5 border-l border-border transition-colors ${tab === "history" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                            History
                        </button>
                    </div>
                </div>

                {/* ── Requests ─────────────────────────────────────────────── */}
                <div className="space-y-2">
                    <SectionLabel
                        title={tab === "pending" ? "My Pending Requests" : "History"}
                        count={myRequests.total}
                    />
                    <RequestsTable rows={rows} />
                </div>

                {/* ── Pagination footer ────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {myRequests.total} record{myRequests.total !== 1 ? "s" : ""}
                        {search && <> · matching &ldquo;{search}&rdquo;</>}
                    </p>
                    <Pagination
                        current={myRequests.current_page}
                        last={myRequests.last_page}
                        onPageChange={changePage}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
