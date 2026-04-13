import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";

/**
 * Shared navigation / search / pagination logic for leave request pages.
 *
 * @param {string} routeName  - Ziggy route name for this page
 * @param {string} tab        - current tab from Inertia props ("pending" | "history")
 * @param {string} search     - current search term from Inertia props
 */
export function useRequestPage({ routeName, tab, search }) {
    const [searchInput, setSearchInput] = useState(search ?? "");

    function navigate(params) {
        router.get(
            route(routeName),
            { tab, search, page: 1, ...params },
            { preserveScroll: true, preserveState: true },
        );
    }

    function changeTab(t) {
        navigate({ tab: t, search: "", page: 1 });
        setSearchInput("");
    }

    function changePage(p) {
        navigate({ page: p });
    }

    const doSearch = useCallback(() => {
        navigate({ search: searchInput, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, tab]);

    return { searchInput, setSearchInput, changeTab, changePage, doSearch };
}
