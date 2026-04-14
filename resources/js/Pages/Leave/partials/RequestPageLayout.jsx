import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Hourglass,
    History,
} from "lucide-react";
import { RequestsTable, SectionLabel } from "@/Components/Leave/RequestsTable";
import { LeaveDetailsModal } from "@/Components/Leave/ApprovalDialogs";
import { useRequestPage } from "../hooks/useRequestPage";

// ── Pagination ────────────────────────────────────────────────────────────────

export function Pagination({ current, last, onPageChange }) {
    if (last <= 1) return null;
    return (
        <div className="flex items-center gap-1">
            <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={current === 1}
                onClick={() => onPageChange(1)}
            >
                <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={current === 1}
                onClick={() => onPageChange(current - 1)}
            >
                <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
                <strong>{current}</strong> / <strong>{last}</strong>
            </span>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={current === last}
                onClick={() => onPageChange(current + 1)}
            >
                <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={current === last}
                onClick={() => onPageChange(last)}
            >
                <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function RequestPageLayout({
    title,
    routeName,
    myRequests,
    tab,
    search,
}) {
    const [viewTarget, setViewTarget] = useState(null);

    const { searchInput, setSearchInput, changeTab, changePage, doSearch } =
        useRequestPage({ routeName, tab, search });

    const rows = myRequests.data ?? [];

    return (
        <AuthenticatedLayout>
            <Head title={title} />

            <div className="space-y-4">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold">{title}</h1>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                className="h-8 w-72 pl-8 text-sm"
                                placeholder="Search type or reason…"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && doSearch()
                                }
                            />
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={doSearch}
                        >
                            Search
                        </Button>
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <Tabs value={tab} onValueChange={changeTab}>
                    <TabsList>
                        <TabsTrigger value="pending">
                            <Hourglass className="h-3.5 w-3.5" />
                            Pending
                            {tab === "pending" && myRequests.total > 0 && (
                                <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                                    {myRequests.total}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="h-3.5 w-3.5" />
                            History
                            {tab === "history" && myRequests.total > 0 && (
                                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                                    {myRequests.total}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={tab} className="space-y-2">
                        <SectionLabel
                            title={
                                tab === "pending"
                                    ? "My Pending Requests"
                                    : "History"
                            }
                            count={myRequests.total}
                        />
                        <RequestsTable
                            rows={rows}
                            onRowClick={(r) => setViewTarget(r)}
                        />

                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-muted-foreground">
                                {myRequests.total} record
                                {myRequests.total !== 1 ? "s" : ""}
                                {search && (
                                    <> · matching &ldquo;{search}&rdquo;</>
                                )}
                            </p>
                            <Pagination
                                current={myRequests.current_page}
                                last={myRequests.last_page}
                                onPageChange={changePage}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <LeaveDetailsModal
                target={viewTarget}
                onClose={() => setViewTarget(null)}
            />
        </AuthenticatedLayout>
    );
}
