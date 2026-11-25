// Bordered card used by every CDRRMO dashboard widget.
export function Widget_card({
    title,
    action,
    className = "",
    children,
}: {
    title: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5 ${className}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-semibold uppercase leading-[16.5px] tracking-[0.5px] text-agap-muted">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}
