// PROTOTYPE ONLY: class suspension advisories are kept in server memory and reset on restart.
// Replace with a real database table before production.

import { randomUUID } from "node:crypto";
import type { delivery_channel } from "./announcement_tracker";
import { rainfall_warning_labels } from "./weather";
import { get_weather_history } from "./weather_history";

export const advisory_levels = ["all", "preschool_to_elementary", "preschool_to_high_school", "college"] as const;
export type advisory_level = (typeof advisory_levels)[number];

export const advisory_level_labels: Record<advisory_level, string> = {
    all: "All levels, public and private",
    preschool_to_elementary: "Preschool to Elementary",
    preschool_to_high_school: "Preschool to Senior High School",
    college: "College and graduate school",
};

export function is_advisory_level(value: string): value is advisory_level {
    return (advisory_levels as readonly string[]).includes(value);
}

export type advisory_status = "draft" | "scheduled" | "published" | "cancelled";

export const advisory_status_labels: Record<advisory_status, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    published: "Published",
    cancelled: "Cancelled",
};

export type advisory = {
    id: string;
    title: string;
    level: advisory_level;
    coverage: string; // e.g. "Citywide" or a list of barangays
    message: string;
    status: advisory_status;
    scheduled_for?: number; // only for "scheduled"
    created_at: number;
    updated_at: number;
    published_at?: number;
    cancelled_at?: number;
    updated_by?: string;
    failed_channels?: delivery_channel[]; // channels that failed to deliver after publishing
    revisions?: advisory_revision[]; // updates made after publishing, oldest first
    last_sent_at?: number; // when the latest version went out (publish or update)
    archived_at?: number; // archived notices keep their status but leave the active lists
    archived_by?: string;
};

export type advisory_revision = {
    at: number;
    by: string;
    note: string; // what changed, as written by the officer
    previous: Pick<advisory, "title" | "level" | "coverage" | "message">;
};

export type advisory_content = Omit<advisory_input, "scheduled_for">;

export type advisory_input = {
    title: string;
    level: advisory_level;
    coverage: string;
    message: string;
    scheduled_for?: number; // set = scheduled, unset = draft
};

const advisories: advisory[] = [];

const minute = 60_000;
const hour = 60 * minute;

// Sample advisories so the dashboard has something to show on first load.
function seed(now: number) {
    const samples: Array<Omit<advisory, "id" | "updated_at">> = [
        {
            title: "Suspension of classes due to heavy rainfall",
            level: "preschool_to_high_school",
            coverage: "Citywide",
            message:
                "Due to the Yellow Rainfall Warning issued by PAGASA, face-to-face classes from Preschool to Senior High School in public and private schools are suspended this afternoon. Schools may shift to modular or online learning.",
            status: "scheduled",
            scheduled_for: now + 45 * minute,
            created_at: now - 50 * minute,
        },
        {
            title: "Suspension of classes in flood-prone barangays",
            level: "all",
            coverage: "Salitran II, Paliparan III",
            message:
                "Classes at all levels in schools within Barangays Salitran II and Paliparan III are suspended tomorrow due to rising water levels along the Julian River.",
            status: "draft",
            created_at: now - 20 * minute,
        },
        {
            title: "Afternoon class suspension: heat index advisory",
            level: "preschool_to_elementary",
            coverage: "Citywide",
            message: "Face-to-face classes for Preschool to Elementary are suspended from 12:00 NN due to a high heat index.",
            status: "draft",
            created_at: now - 3 * hour,
        },
        {
            title: "Suspension of afternoon classes, Preschool to Elementary",
            level: "preschool_to_elementary",
            coverage: "Citywide",
            message: "Afternoon face-to-face classes for Preschool to Elementary are suspended today due to continuous rain.",
            status: "published",
            published_at: now - 8 * minute,
            created_at: now - 40 * minute,
        },
        {
            title: "Suspension of classes in Barangay Sampaloc IV",
            level: "all",
            coverage: "Sampaloc IV",
            message: "Classes at all levels in Barangay Sampaloc IV are suspended due to drainage overflow along the main road.",
            status: "published",
            published_at: now - 2 * hour,
            created_at: now - 150 * minute,
            failed_channels: ["facebook"],
        },
        {
            title: "Suspension of classes, College level",
            level: "college",
            coverage: "Citywide",
            message: "College classes are suspended this morning. This advisory was withdrawn after the rainfall warning was lowered.",
            status: "cancelled",
            cancelled_at: now - 5 * hour,
            created_at: now - 6 * hour,
        },
    ];
    samples.push(...past_suspensions(now));
    for (const sample of samples) {
        const updated_at = sample.published_at ?? sample.cancelled_at ?? sample.created_at;
        advisories.push({ ...sample, id: randomUUID(), updated_at });
    }
}

// Past suspensions for the high-risk days in the weather history, published at 5:00 AM.
// Ones older than 14 days are archived.
// The oldest high-risk day is left without one, so the weather page has a missed day to point out.
function past_suspensions(now: number): Array<Omit<advisory, "id" | "updated_at">> {
    const high_risk_days = get_weather_history(30, now)
        .slice(0, -1) // today is covered by the samples above
        .filter((day) => day.risk === "high" || day.risk === "critical")
        .slice(1);

    return high_risk_days.map((day) => {
        const published_at = day.day_start + 5 * hour;
        const is_critical = day.risk === "critical";
        return {
            title: is_critical ? "Suspension of classes due to torrential rain" : "Suspension of classes due to heavy rainfall",
            level: is_critical ? "all" : "preschool_to_high_school",
            coverage: "Citywide",
            message: `Due to the ${rainfall_warning_labels[day.rainfall_warning]} issued by PAGASA, face-to-face classes are suspended today. Schools may shift to modular or online learning.`,
            status: "published",
            published_at,
            created_at: published_at - 30 * minute,
            // Older notices have been tidied away into the archive.
            ...(now - published_at > 14 * 24 * hour ? { archived_at: published_at + 2 * 24 * hour, archived_by: "u_cdrrmo" } : {}),
        };
    });
}

// Puts the sample advisories back. Used on first load and by tests.
export function reset_advisories(now: number = Date.now()) {
    advisories.length = 0;
    seed(now);
}

reset_advisories();

export function is_pending(item: advisory): boolean {
    return item.status === "draft" || item.status === "scheduled";
}

// Drafts and scheduled advisories awaiting review. Scheduled ones come first, soonest first,
// then drafts with the most recently edited first.
export function list_pending_advisories(): advisory[] {
    return advisories.filter(is_pending).sort((first, second) => {
        if (first.status !== second.status) return first.status === "scheduled" ? -1 : 1;
        if (first.status === "scheduled") return first.scheduled_for! - second.scheduled_for!;
        return second.updated_at - first.updated_at;
    });
}

export function list_advisories(): readonly advisory[] {
    return advisories;
}

export function find_advisory(id: string): advisory | null {
    return advisories.find((candidate) => candidate.id === id) ?? null;
}

export function create_advisory(input: advisory_input, author_id: string, now: number = Date.now()): advisory {
    const item: advisory = {
        id: randomUUID(),
        ...input,
        status: input.scheduled_for === undefined ? "draft" : "scheduled",
        created_at: now,
        updated_at: now,
        updated_by: author_id,
    };
    advisories.push(item);
    return item;
}

// Edits a draft or scheduled advisory. Returns false when it is unknown or already published/cancelled,
// so a sent advisory can't be rewritten after the fact.
export function update_advisory(id: string, input: advisory_input, editor_id: string, now: number = Date.now()): boolean {
    const item = find_advisory(id);
    if (!item || !is_pending(item)) return false;

    item.title = input.title;
    item.level = input.level;
    item.coverage = input.coverage;
    item.message = input.message;
    item.scheduled_for = input.scheduled_for;
    item.status = input.scheduled_for === undefined ? "draft" : "scheduled";
    item.updated_at = now;
    item.updated_by = editor_id;
    return true;
}

export function publish_advisory(id: string, publisher_id: string, now: number = Date.now()): boolean {
    const item = find_advisory(id);
    if (!item || !is_pending(item)) return false;

    item.status = "published";
    item.published_at = now;
    item.scheduled_for = undefined;
    item.updated_at = now;
    item.updated_by = publisher_id;
    return true;
}

export function cancel_advisory(id: string, canceller_id: string, now: number = Date.now()): boolean {
    const item = find_advisory(id);
    if (!item || !is_pending(item)) return false;

    item.status = "cancelled";
    item.cancelled_at = now;
    item.updated_at = now;
    item.updated_by = canceller_id;
    return true;
}

// Updates a notice that was already published, and re-sends it. The note says what changed,
// and the previous wording is kept so the history shows exactly what was corrected.
export function revise_advisory(
    id: string,
    content: advisory_content,
    note: string,
    editor_id: string,
    now: number = Date.now(),
): boolean {
    const item = find_advisory(id);
    if (!item || item.status !== "published" || is_archived(item)) return false;

    const previous = { title: item.title, level: item.level, coverage: item.coverage, message: item.message };
    item.revisions = [...(item.revisions ?? []), { at: now, by: editor_id, note, previous }];
    item.title = content.title;
    item.level = content.level;
    item.coverage = content.coverage;
    item.message = content.message;
    item.last_sent_at = now;
    item.failed_channels = undefined;
    item.updated_at = now;
    item.updated_by = editor_id;
    return true;
}

export function is_archived(item: advisory): boolean {
    return item.archived_at !== undefined;
}

// Only notices that are finished (published or cancelled) can be archived. Drafts and scheduled
// notices still need a decision, so they have to be published or cancelled first.
export function archive_advisory(id: string, archiver_id: string, now: number = Date.now()): boolean {
    const item = find_advisory(id);
    if (!item || is_pending(item) || is_archived(item)) return false;

    item.archived_at = now;
    item.archived_by = archiver_id;
    return true;
}

export function restore_advisory(id: string): boolean {
    const item = find_advisory(id);
    if (!item || !is_archived(item)) return false;

    item.archived_at = undefined;
    item.archived_by = undefined;
    return true;
}
