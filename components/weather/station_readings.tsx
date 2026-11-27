import { Widget_card } from "@/components/cdrrmo/widget_card";
import { station_status, station_status_labels, type station_reading, type station_status as status } from "@/lib/cdrrmo/weather";

const status_badge_class: Record<status, string> = {
    normal: "bg-agap-100 text-agap-900",
    alert: "bg-orange-100 text-orange-900",
    critical: "bg-red-100 text-red-900",
};

const status_icon: Record<status, string> = { normal: "●", alert: "▲", critical: "■" };

// Rain gauge and river level readings for each monitoring station, worst first.
export function Station_readings({ readings }: { readings: station_reading[] }) {
    const rank: Record<status, number> = { critical: 0, alert: 1, normal: 2 };
    const rows = readings
        .map((reading) => ({ reading, status: station_status(reading) }))
        .sort((first, second) => rank[first.status] - rank[second.status]);

    return (
        <Widget_card title="Monitoring stations">
            <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                    <thead>
                        <tr className="border-b-[0.8px] border-agap-line text-[11px] text-agap-muted">
                            <th scope="col" className="px-1 pb-2 font-medium">Station</th>
                            <th scope="col" className="px-1 pb-2 text-right font-medium">Rain now</th>
                            <th scope="col" className="px-1 pb-2 text-right font-medium">Last 24 h</th>
                            <th scope="col" className="px-1 pb-2 text-right font-medium">River level</th>
                            <th scope="col" className="px-1 pb-2 text-right font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ reading, status }) => (
                            <tr key={reading.station} className="border-b-[0.8px] border-agap-line/60 last:border-0">
                                <th scope="row" className="px-1 py-2.5 font-normal">
                                    <span className="block font-medium text-agap-ink">{reading.station}</span>
                                    <span className="block text-[10px] text-agap-muted">{reading.barangay}</span>
                                </th>
                                <td className="px-1 py-2.5 text-right text-agap-ink">{reading.rainfall_mm_per_hr} mm/hr</td>
                                <td className="px-1 py-2.5 text-right text-agap-ink">{reading.rainfall_last_24h_mm} mm</td>
                                <td className="px-1 py-2.5 text-right text-agap-ink">
                                    {reading.water_level_m === null ? (
                                        <span className="text-agap-muted">No gauge</span>
                                    ) : (
                                        <>
                                            {reading.water_level_m.toFixed(1)} m
                                            <span className="block text-[10px] text-agap-muted">
                                                alert at {reading.alert_level_m!.toFixed(1)} m
                                            </span>
                                        </>
                                    )}
                                </td>
                                <td className="px-1 py-2.5 text-right">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status_badge_class[status]}`}
                                    >
                                        <span aria-hidden className="text-[8px]">{status_icon[status]}</span>
                                        {station_status_labels[status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Widget_card>
    );
}
