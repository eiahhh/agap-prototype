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
