import Image from "next/image";
import { Agap_logo } from "./agap_logo";

type feature_item = {
    icon_src: string;
    text: string;
};

const feature_list: feature_item[] = [
    {
        icon_src: "/login/icon_shield.svg",
        text: "Role-based access for CDRRMO personnel, administrators, and IT staff",
    },
    {
        icon_src: "/login/icon_check_circle.svg",
        text: "Every announcement requires authorized approval before publication",
    },
    {
        icon_src: "/login/icon_history.svg",
        text: "All account activity is recorded in the audit trail",
    },
];

export function Brand_panel() {
    return (
        <aside className="relative hidden overflow-hidden bg-agap-900 px-[52px] py-11 text-white lg:flex lg:flex-col lg:justify-between">
            {/* Faint decorative rings anchored to the bottom-right corner */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[180px] -right-[220px] size-[520px] rounded-full border-[0.8px] border-agap-300/[0.18]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -right-[120px] size-80 rounded-full border-[0.8px] border-agap-300/[0.18]"
            />

            <Agap_logo tone="light" />

            <div className="relative w-full max-w-[440px]">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-300">
                    CDRRMO · Dasmariñas City
                </p>

                <h2 className="mt-2.5 text-[33.28px] font-semibold leading-[39.936px] tracking-[-0.9984px]">
                    Verified information for faster, calmer decisions.
                </h2>

                <p className="mt-3.5 text-[13px] leading-[22.1px] text-agap-200">
                    Monitor weather observations, prepare announcements, and route every advisory through
                    authorized human review.
                </p>

                <ul className="mt-10 space-y-3.5 border-t-[0.8px] border-agap-300/[0.22] pt-[22px]">
                    {feature_list.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-3 text-[11px] leading-[17.6px] text-agap-100">
                            <Image src={feature.icon_src} alt="" width={18} height={18} className="mt-px shrink-0" />
                            {feature.text}
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
