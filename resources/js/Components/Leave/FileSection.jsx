export default function FileSection({ step, icon: Icon, title, children, accent }) {
    const borderAccent =
        accent === "red"   ? "border-l-destructive" :
        accent === "amber" ? "border-l-amber-400"   : "border-l-border";

    const iconBg =
        accent === "red"   ? "bg-destructive/10" :
        accent === "amber" ? "bg-amber-400/10"   : "bg-muted";

    const iconColor =
        accent === "red"   ? "text-destructive" :
        accent === "amber" ? "text-amber-500"   : "text-muted-foreground";

    const titleColor =
        accent === "red"   ? "text-destructive" :
        accent === "amber" ? "text-amber-600 dark:text-amber-400" : "text-foreground";

    return (
        <div className={`rounded-xl border border-border border-l-4 ${borderAccent} bg-card shadow-sm`}>
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                {step ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {step}
                    </span>
                ) : Icon && (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                    </span>
                )}
                <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}
