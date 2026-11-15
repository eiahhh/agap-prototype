import type { ReactNode } from "react";
import { Agap_logo } from "./agap_logo";

type feature_item = {
    icon_paths: ReactNode;
    text: string;
};

// Simple outline icons (24x24 grid). Only the inner paths are stored here.
const feature_list: feature_item[] = [
    {
        icon_paths: (
            <>
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        text: "Role-based access for CDRRMO personnel, administrators, and IT staff",
    },
    {
        icon_paths: (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        text: "Every announcement requires authorized approval before publication",
    },
    {
        icon_paths: (
            <>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
            </>
        ),
        text: "All account activity is recorded in the audit trail",
    },
];

export function Brand_panel() {
    return (
        <aside className="relative hidden overflow-hidden bg-agap-900 px-14 pb-12 pt-14 text-white lg:flex lg:flex-col lg:justify-between">
            {/* Faint decorative rings anchored to the bottom-right corner */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[322px] -right-[350px] size-[700px] rounded-full border border-white/[0.07]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[207px] -right-[235px] size-[470px] rounded-full border border-white/[0.07]"
            />

            <Agap_logo tone="light" />

            <div className="relative max-w-[31rem]">
                <p className="text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-white/70">
                    CDRRMO · Dasmariñas City
                </p>

                <h2 className="mt-3 text-[38px] font-semibold leading-[1.2] tracking-[-0.02em]">
                    Verified information for faster, calmer decisions.
                </h2>

                <p className="mt-4 text-[15px] leading-[1.7] text-white/75">
                    Monitor weather observations, prepare announcements, and route every advisory through
                    authorized human review.
                </p>

                <ul className="mt-11 space-y-4 border-t border-white/15 pt-6">
                    {feature_list.map((feature) => (
                        <li key={feature.text} className="flex items-center gap-3.5 text-[13px] leading-[21px] text-white/85">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.75}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="size-[18px] shrink-0 text-agap-300"
                            >
                                {feature.icon_paths}
                            </svg>
                            {feature.text}
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
