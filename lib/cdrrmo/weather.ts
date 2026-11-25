// PROTOTYPE ONLY: weather readings are sample data for Dasmariñas City.
// Replace get_weather_snapshot() with a PAGASA / weather API feed before production.

export type rainfall_warning = "none" | "yellow" | "orange" | "red";
export type risk_level = "low" | "moderate" | "high" | "critical";

export type weather_reading = {
    temperature_c: number;
    heat_index_c: number;
    humidity_pct: number;
    rainfall_mm_per_hr: number;
    wind_kph: number;
    condition: string;
};

export type forecast_hour = {
    hour_offset: number; // hours from the reading time
    condition: string;
    temperature_c: number;
    rain_chance_pct: number;
};

export type barangay_flood_risk = {
    barangay: string;
    risk: risk_level;
    note: string;
};

export type weather_snapshot = {
    location: string;
    observed_at: number;
    current: weather_reading;
    rainfall_warning: rainfall_warning;
    wind_signal: number; // PAGASA Tropical Cyclone Wind Signal, 0 = none, 1-5
    forecast: forecast_hour[];
    barangays: barangay_flood_risk[];
};

export const risk_labels: Record<risk_level, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
    critical: "Critical",
};

export const rainfall_warning_labels: Record<rainfall_warning, string> = {
    none: "No rainfall warning",
    yellow: "Yellow rainfall warning",
    orange: "Orange rainfall warning",
    red: "Red rainfall warning",
};

// Overall risk for the city, from the most severe of the current hazards.
// Thresholds follow PAGASA rainfall warnings (7.5 / 15 / 30 mm per hour),
// wind signals, and the heat index danger bands (42 / 52 °C).
export function assess_risk(input: {
    rainfall_mm_per_hr: number;
    wind_signal: number;
    heat_index_c: number;
    rainfall_warning: rainfall_warning;
}): risk_level {
    const levels: risk_level[] = [
        rain_risk(input.rainfall_mm_per_hr),
        warning_risk(input.rainfall_warning),
        wind_risk(input.wind_signal),
        heat_risk(input.heat_index_c),
    ];
    return levels.reduce((worst, level) => (risk_rank[level] > risk_rank[worst] ? level : worst), "low");
}

const risk_rank: Record<risk_level, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

function rain_risk(mm_per_hr: number): risk_level {
    if (mm_per_hr >= 30) return "critical";
    if (mm_per_hr >= 15) return "high";
    if (mm_per_hr >= 7.5) return "moderate";
    return "low";
}

function warning_risk(warning: rainfall_warning): risk_level {
    return ({ none: "low", yellow: "moderate", orange: "high", red: "critical" } as const)[warning];
}

function wind_risk(signal: number): risk_level {
    if (signal >= 3) return "critical";
    if (signal === 2) return "high";
    if (signal === 1) return "moderate";
    return "low";
}

function heat_risk(heat_index_c: number): risk_level {
    if (heat_index_c >= 52) return "critical";
    if (heat_index_c >= 42) return "high";
    if (heat_index_c >= 33) return "moderate";
    return "low";
}

export function get_weather_snapshot(now: number = Date.now()): weather_snapshot {
    return {
        location: "Dasmariñas City, Cavite",
        observed_at: now,
        current: {
            temperature_c: 26,
            heat_index_c: 29,
            humidity_pct: 88,
            rainfall_mm_per_hr: 9.2,
            wind_kph: 34,
            condition: "Moderate to heavy rain",
        },
        rainfall_warning: "yellow",
        wind_signal: 1,
        forecast: [
            { hour_offset: 1, condition: "Heavy rain", temperature_c: 25, rain_chance_pct: 90 },
            { hour_offset: 2, condition: "Heavy rain", temperature_c: 25, rain_chance_pct: 85 },
            { hour_offset: 3, condition: "Rain", temperature_c: 25, rain_chance_pct: 70 },
            { hour_offset: 4, condition: "Light rain", temperature_c: 26, rain_chance_pct: 55 },
            { hour_offset: 5, condition: "Cloudy", temperature_c: 26, rain_chance_pct: 40 },
            { hour_offset: 6, condition: "Cloudy", temperature_c: 27, rain_chance_pct: 30 },
        ],
        barangays: [
            { barangay: "Salitran II", risk: "high", note: "Low-lying, near Julian River" },
            { barangay: "Paliparan III", risk: "high", note: "Flash flood history" },
            { barangay: "Sampaloc IV", risk: "moderate", note: "Drainage overflow reported" },
            { barangay: "Burol Main", risk: "moderate", note: "Monitor creek level" },
            { barangay: "Langkaan II", risk: "low", note: "No reports" },
        ],
    };
}

export type station_status = "normal" | "alert" | "critical";

export const station_status_labels: Record<station_status, string> = {
    normal: "Normal",
    alert: "Alert",
    critical: "Critical",
};

export type station_reading = {
    station: string;
    barangay: string;
    rainfall_mm_per_hr: number;
    rainfall_last_24h_mm: number;
    water_level_m: number | null; // null when the station has no river gauge
    alert_level_m: number | null;
};

// Rain gauge and river level stations around the city.
export function get_station_readings(): station_reading[] {
    return [
        { station: "Julian River Bridge", barangay: "Salitran II", rainfall_mm_per_hr: 12.4, rainfall_last_24h_mm: 86, water_level_m: 3.1, alert_level_m: 3.0 },
        { station: "Paliparan Creek", barangay: "Paliparan III", rainfall_mm_per_hr: 10.8, rainfall_last_24h_mm: 79, water_level_m: 2.2, alert_level_m: 2.5 },
        { station: "City Hall AWS", barangay: "Zone I (Poblacion)", rainfall_mm_per_hr: 9.2, rainfall_last_24h_mm: 64, water_level_m: null, alert_level_m: null },
        { station: "Sampaloc Drainage Outfall", barangay: "Sampaloc IV", rainfall_mm_per_hr: 8.1, rainfall_last_24h_mm: 58, water_level_m: 1.4, alert_level_m: 1.8 },
        { station: "Langkaan Industrial AWS", barangay: "Langkaan II", rainfall_mm_per_hr: 5.6, rainfall_last_24h_mm: 41, water_level_m: null, alert_level_m: null },
    ];
}

// Critical once the river is at or above its alert level or rain is torrential,
// alert when it is within 0.5 m of the alert level or rain is heavy.
export function station_status(reading: station_reading): station_status {
    const { water_level_m, alert_level_m, rainfall_mm_per_hr } = reading;
    const has_gauge = water_level_m !== null && alert_level_m !== null;
    if ((has_gauge && water_level_m >= alert_level_m) || rainfall_mm_per_hr >= 30) return "critical";
    if ((has_gauge && water_level_m >= alert_level_m - 0.5) || rainfall_mm_per_hr >= 15) return "alert";
    return "normal";
}

export type outlook_hour = {
    hour_offset: number;
    rainfall_mm_per_hr: number;
    rain_chance_pct: number;
    temperature_c: number;
    wind_kph: number;
};

// Hour-by-hour outlook for the next day: heavy rain easing into the evening, then building again overnight.
export function get_hourly_outlook(hours = 24): outlook_hour[] {
    const rain_curve = [11, 13, 10, 8, 6, 4, 3, 2, 2, 1, 1, 2, 3, 5, 7, 9, 8, 6, 4, 3, 2, 2, 1, 1];
    return Array.from({ length: hours }, (_, index) => {
        const rainfall = rain_curve[index % rain_curve.length];
        return {
            hour_offset: index + 1,
            rainfall_mm_per_hr: rainfall,
            rain_chance_pct: Math.min(95, 25 + rainfall * 6),
            temperature_c: 25 + Math.round((12 - rainfall) / 4),
            wind_kph: 18 + rainfall * 2,
        };
    });
}
