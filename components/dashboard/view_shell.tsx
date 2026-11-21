// Shared heading block for the role dashboards.
export function View_shell({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    return (
        <section className="mx-auto w-full max-w-[1120px]">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">{eyebrow}</p>
            <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">{title}</h1>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">{description}</p>
            {children}
        </section>
    );
}

export function Placeholder_card({ label }: { label: string }) {
    return (
        <p className="mt-8 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
            {label}
        </p>
    );
}
