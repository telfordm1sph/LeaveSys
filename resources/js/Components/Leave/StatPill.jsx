export default function StatPill({ label, value, sub, red, green }) {
    const borderCls = red   ? "border-destructive/30 bg-destructive/5"
                    : green ? "border-emerald-400/30 bg-emerald-400/5"
                    : "bg-muted/30";

    const valueCls  = red   ? "text-destructive"
                    : green ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground";

    return (
        <div className={`flex flex-col rounded-lg border px-4 py-3 ${borderCls}`}>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className={`text-lg font-bold tabular-nums leading-tight ${valueCls}`}>{value}</span>
            {sub && <span className="text-[10px] tabular-nums text-muted-foreground">{sub}</span>}
        </div>
    );
}
