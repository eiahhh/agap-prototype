// Single-series bar chart in plain HTML: one hue, rounded data ends, recessive grid,
// dashed reference lines, a tooltip on hover or keyboard focus, and a table view for screen readers.

export type bar_datum = {
    key: string;
    label: string; // x-axis label
    value: number;
    tooltip: string[]; // lines shown on hover; the first line is the heading
};

export type reference_line = { value: number; label: string };

export function Bar_chart({
    title,
    unit,
    data,
    reference_lines = [],
    label_every = 1,
    height_px = 160,
}: {
    title: string;
    unit: string;
    data: bar_datum[];
    reference_lines?: reference_line[];
    label_every?: number; // show every nth x-axis label so they don't collide
    height_px?: number;
}) {
    const max_value = Math.max(1, ...data.map((datum) => datum.value), ...reference_lines.map((line) => line.value));
    const scale_max = nice_ceiling(max_value);
    const ticks = [0, scale_max / 2, scale_max];

    return (
        <figure className="m-0">
            <div className="flex gap-2">
                {/* y-axis */}
                <div className="relative w-8 shrink-0 text-right text-[10px] text-agap-muted" style={{ height: height_px }} aria-hidden>
                    {ticks.map((tick) => (
                        <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(tick / scale_max) * 100}%` }}>
                            {format_number(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative min-w-0 flex-1">
                    {/* grid + reference lines */}
                    <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: height_px }} aria-hidden>
                        {ticks.map((tick) => (
                            <div
                                key={tick}
                                className={`absolute inset-x-0 border-t-[0.8px] ${tick === 0 ? "border-agap-muted/40" : "border-agap-line"}`}
                                style={{ bottom: `${(tick / scale_max) * 100}%` }}
                            />
                        ))}
                        {reference_lines.map((line) => (
                            <div
                                key={line.label}
                                className="absolute inset-x-0 border-t border-dashed border-agap-ink/35"
                                style={{ bottom: `${(line.value / scale_max) * 100}%` }}
                            >
                                <span className="absolute -top-[15px] right-0 bg-agap-field/90 px-1 text-[9px] font-medium text-agap-muted">
                                    {line.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* bars */}
                    <ol className="relative flex items-end gap-[2px]" style={{ height: height_px }} aria-hidden>
                        {data.map((datum, index) => (
                            <li key={datum.key} className="group relative flex h-full min-w-0 flex-1 items-end justify-center" tabIndex={0}>
                                <div
                                    className="w-full max-w-[18px] rounded-t-[4px] bg-agap-700 transition-colors group-hover:bg-agap-900 group-focus:bg-agap-900"
                                    style={{ height: `${Math.max(datum.value > 0 ? 1.5 : 0, (datum.value / scale_max) * 100)}%` }}
                                />
                                <div
                                    role="tooltip"
                                    className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-[180px] rounded-[8px] bg-agap-ink px-2.5 py-1.5 text-[10px] leading-[14px] text-white shadow-lg group-hover:block group-focus:block ${index < data.length / 2 ? "left-0" : "right-0"}`}
                                >
                                    {datum.tooltip.map((line, line_index) => (
                                        <p key={line} className={line_index === 0 ? "font-semibold" : "text-white/80"}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {/* x-axis labels */}
                    <ol className="mt-1.5 flex gap-[2px]" aria-hidden>
                        {data.map((datum, index) => (
                            <li key={datum.key} className="min-w-0 flex-1 text-center text-[9px] leading-[12px] text-agap-muted">
                                {index % label_every === 0 ? datum.label : ""}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <details className="mt-3 text-[11px] text-agap-muted">
                <summary className="cursor-pointer font-semibold text-agap-700">Show data table</summary>
                <table className="mt-2 w-full text-left">
                    <caption className="sr-only">{title}</caption>
                    <thead>
                        <tr className="border-b-[0.8px] border-agap-line">
                            <th scope="col" className="py-1 font-medium">
                                Time
                            </th>
                            <th scope="col" className="py-1 text-right font-medium">
                                {unit}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((datum) => (
                            <tr key={datum.key} className="border-b-[0.8px] border-agap-line/60">
                                <td className="py-1 text-agap-ink">{datum.tooltip[0]}</td>
                                <td className="py-1 text-right text-agap-ink">{format_number(datum.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}

// Rounds the axis maximum up to 1, 2, 2.5 or 5 × a power of ten so tick labels stay readable.
export function nice_ceiling(value: number): number {
    if (value <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value)!;
    return step * magnitude;
}

function format_number(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
