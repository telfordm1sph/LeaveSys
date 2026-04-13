import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import Dropdown from "./DropDown";

import {
    CalendarDays, FilePlus, ScrollText, TrendingUp,
    Umbrella, Settings2, Users, Clock,
} from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;

    const adminLeaveLinks = [
        { href: route("admin.leave.policy"),        label: "Leave Policy",       icon: <ScrollText className="w-4 h-4" /> },
        { href: route("admin.leave.accrual-tiers"), label: "Accrual Tiers",      icon: <TrendingUp  className="w-4 h-4" /> },
        { href: route("admin.leave.holidays"),      label: "Holidays",           icon: <Umbrella    className="w-4 h-4" /> },
        { href: route("admin.leave.year-end"),      label: "Year-End Config",    icon: <Clock       className="w-4 h-4" /> },
        { href: route("admin.leave.balances"),      label: "Employee Balances",  icon: <Users       className="w-4 h-4" /> },
    ];

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            <SidebarLink
                href={route("leave.balances")}
                label="Leave Balances"
                icon={<CalendarDays className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("leave.file")}
                label="File Leave"
                icon={<FilePlus className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />

            <Dropdown
                label="Leave Admin"
                icon={<Settings2 className="w-5 h-5" />}
                links={adminLeaveLinks}
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
