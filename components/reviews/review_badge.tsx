import type { advisory } from "@/lib/cdrrmo/advisories";

const badge = {
    none: { label: "Not submitted", class_name: "bg-agap-line/70 text-agap-muted", icon: "○" },
    in_review: { label: "In review", class_name: "bg-violet-100 text-violet-900", icon: "◔" },
    approved: { label: "Approved", class_name: "bg-agap-100 text-agap-900", icon: "✓" },
    changes_requested: { label: "Changes requested", class_name: "bg-orange-100 text-orange-900", icon: "!" },
} as const;

// Review state of a draft or scheduled notice. Published and cancelled notices don't show it.
export function Review_badge({ item }: { item: advisory }) {
    const { label, class_name, icon } = badge[item.review?.state ?? "none"];
    return (
        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${class_name}`}>
            <span aria-hidden>{icon}</span>
            {label}
        </span>
    );
}
