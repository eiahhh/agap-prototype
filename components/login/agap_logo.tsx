type agap_logo_props = {
    tone?: "light" | "dark";
};

// Logo mark: a rounded square turned 45° with three overlapping circles,
// matching the Figma "AGAP" mark.
export function Agap_logo({ tone = "light" }: agap_logo_props) {
    const is_light = tone === "light";
    const mark_color = is_light ? "bg-agap-300" : "bg-agap-700";

    return (
        <div className="flex items-center gap-[11px]">
            <div aria-hidden="true" className="relative size-[31px] shrink-0">
                <div
                    className={`absolute inset-0 rotate-45 rounded-t-[15.5px] rounded-b-[14.88px] ${mark_color}`}
                >
                    <span className={`absolute -left-1.5 top-[5px] size-5 rounded-full ${mark_color}`} />
                    <span className={`absolute -top-1.5 left-[5px] size-5 rounded-full ${mark_color}`} />
                    <span className={`absolute left-3 top-3 size-5 rounded-full ${mark_color}`} />
                </div>
            </div>

            <div>
                <p
                    className={`text-[22px] font-bold leading-[33px] tracking-[-0.88px] ${is_light ? "text-white" : "text-agap-ink"}`}
                >
                    AGAP
                </p>
                <p className={`text-[10px] leading-[15px] ${is_light ? "text-agap-300" : "text-agap-muted"}`}>
                    Alert &amp; Guidance Portal
                </p>
            </div>
        </div>
    );
}
