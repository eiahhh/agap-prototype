// PROTOTYPE ONLY: past weather is generated from each date, so the same day always shows the same numbers.
// Replace with recorded PAGASA / station data before production.

import { assess_risk, get_weather_snapshot, type rainfall_warning, type risk_level } from "./weather";

export type daily_weather = {
    date: string; // YYYY-MM-DD in Manila
    day_start: number; // 12:00 AM Manila, epoch ms
    total_rainfall_mm: number;
    peak_rainfall_mm_per_hr: number;
    max_heat_index_c: number;
    max_wind_kph: number;
    wind_signal: number;
    rainfall_warning: rainfall_warning;
    risk: risk_level;
};

const day_ms = 86_400_000;
const manila_offset_ms = 8 * 3_600_000;

// "2026-11-26" for any time on that day in Manila.
export function manila_date(timestamp: number): string {
    return new Date(timestamp + manila_offset_ms).toISOString().slice(0, 10);
}

export function manila_day_start(timestamp: number): number {
    return Date.parse(`${manila_date(timestamp)}T00:00:00+08:00`);
}

// Small seeded random number generator (mulberry32), seeded from the date string.
function random_for(date: string): () => number {
    let seed = 0;
    for (const char of date) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) | 0;
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    };
}

export function warning_for_rainfall(peak_mm_per_hr: number): rainfall_warning {
    if (peak_mm_per_hr >= 30) return "red";
    if (peak_mm_per_hr >= 15) return "orange";
    if (peak_mm_per_hr >= 7.5) return "yellow";
    return "none";
}

export function signal_for_wind(max_wind_kph: number): number {
    if (max_wind_kph >= 89) return 3;
    if (max_wind_kph >= 62) return 2;
    if (max_wind_kph >= 39) return 1;
    return 0;
}

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function generated_day(day_start: number): daily_weather {
    const date = manila_date(day_start);
    const random = random_for(date);
    const is_rainy = random() < 0.55;
    // Rainy days skew towards light rain, with the odd heavy or torrential day.
    const peak = is_rainy ? round1(1 + random() ** 2 * 34) : round1(random() * 1.5);
    const total = round1(peak * (2 + random() * 4));
    const heat_index = Math.round(is_rainy ? 27 + random() * 5 : 31 + random() * 10);
    const wind = Math.round(10 + random() * 25 + (peak > 20 ? random() * 30 : 0));

    return to_day(date, day_start, total, peak, heat_index, wind);
}

function to_day(date: string, day_start: number, total: number, peak: number, heat_index: number, wind: number): daily_weather {
    const rainfall_warning = warning_for_rainfall(peak);
    const wind_signal = signal_for_wind(wind);
    return {
        date,
        day_start,
        total_rainfall_mm: total,
        peak_rainfall_mm_per_hr: peak,
        max_heat_index_c: heat_index,
        max_wind_kph: wind,
        wind_signal,
        rainfall_warning,
        risk: assess_risk({ rainfall_mm_per_hr: peak, wind_signal, heat_index_c: heat_index, rainfall_warning }),
    };
}

// Today's record follows the live snapshot so the page and the history agree.
function today(now: number): daily_weather {
    const snapshot = get_weather_snapshot(now);
    const day = to_day(
        manila_date(now),
        manila_day_start(now),
        64,
        snapshot.current.rainfall_mm_per_hr,
        snapshot.current.heat_index_c,
        snapshot.current.wind_kph,
    );
    return { ...day, rainfall_warning: snapshot.rainfall_warning, wind_signal: snapshot.wind_signal };
}

export function weather_on(timestamp: number, now: number = Date.now()): daily_weather {
    const day_start = manila_day_start(timestamp);
    return day_start === manila_day_start(now) ? today(now) : generated_day(day_start);
}

// The last `days` days, oldest first, ending today.
export function get_weather_history(days: number, now: number = Date.now()): daily_weather[] {
    const today_start = manila_day_start(now);
    return Array.from({ length: days }, (_, index) => weather_on(today_start - (days - 1 - index) * day_ms, now));
}
