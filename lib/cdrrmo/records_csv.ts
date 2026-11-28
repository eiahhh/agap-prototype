// CSV export of historical records.

import { advisory_level_labels } from "./advisories";
import type { history_record } from "./records";
import { rainfall_warning_labels, risk_labels } from "./weather";

const manila_offset_ms = 8 * 3_600_000;

// "2026-11-26 10:00" in Manila time.
function manila_timestamp(at: number): string {
    return new Date(at + manila_offset_ms).toISOString().slice(0, 16).replace("T", " ");
}

// Quotes a cell when needed, and stops spreadsheets from running text that starts like a formula.
export function csv_cell(value: string | number): string {
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const header = [
    "Date (Manila)",
    "Title",
    "Levels",
    "Coverage",
    "Outcome",
    "Times updated",
    "Archived",
    "Weather risk",
    "Peak rainfall (mm/hr)",
    "Rainfall warning",
    "Message",
];

export function records_to_csv(records: history_record[]): string {
    const rows = records.map((record) => [
        manila_timestamp(record.at),
        record.advisory.title,
        advisory_level_labels[record.advisory.level],
        record.advisory.coverage,
        record.outcome === "published" ? "Published" : "Cancelled",
        record.updates,
        record.advisory.archived_at === undefined ? "No" : "Yes",
        risk_labels[record.weather.risk],
        record.weather.peak_rainfall_mm_per_hr,
        rainfall_warning_labels[record.weather.rainfall_warning],
        record.advisory.message,
    ]);
    // CRLF line endings and a byte order mark so Excel opens it as UTF-8 (ñ in Dasmariñas, curly quotes).
    return "﻿" + [header, ...rows].map((row) => row.map(csv_cell).join(",")).join("\r\n") + "\r\n";
}
