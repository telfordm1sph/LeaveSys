import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import BalanceCard from "@/Components/Leave/BalanceCard";

export default function Balances({ balances }) {
    const { emp_data } = usePage().props;

    const totalDays = balances.reduce((s, b) => s + (parseInt(b.balance_minutes, 10) || 0) / 480, 0);
    const lowCount  = balances.filter((b) => (parseInt(b.balance_minutes, 10) || 0) / 480 < 1).length;

    return (
        <AuthenticatedLayout>
            <Head title="Leave Balances" />

            <div className="space-y-5">

                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-bold leading-none">Leave Balances</h1>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {emp_data?.emp_name}&ensp;·&ensp;1 day = 8 hrs = 480 min
                        </p>
                    </div>
                    {balances.length > 0 && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                                <span className="font-semibold text-foreground">{totalDays.toFixed(2)}</span> total days
                            </span>
                            {lowCount > 0 && (
                                <span className="font-medium text-destructive">
                                    {lowCount} low balance{lowCount > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Grid */}
                {balances.length === 0 ? (
                    <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
                        No leave balance records found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {balances.map((b) => <BalanceCard key={b.id} balance={b} />)}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
