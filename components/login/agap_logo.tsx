type agap_logo_props = {
    tone?: "light" | "dark";
};

export function Agap_logo({ tone = "light" }: agap_logo_props) {
    const is_light = tone === "light";

    return (
        <div className="flex items-center gap-2.5">
            <svg
                viewBox="0 0 40 44"
                fill="currentColor"
                aria-hidden="true"
                className={`h-11 w-10 shrink-0 ${is_light ? "text-agap-300" : "text-agap-700"}`}
            >
                <path d="M20 9 C18 4 13 2 9.5 3.5 C4 6 1 12 2.5 20 C4 28 9 33 12 38 C13.5 40.5 15.5 42 17.5 42 C19 42 19.7 40.5 20 39.5 C20.3 40.5 21 42 22.5 42 C24.5 42 26.5 40.5 28 38 C31 33 36 28 37.5 20 C39 12 36 6 30.5 3.5 C27 2 22 4 20 9 Z" />
            </svg>

            <div>
                <p className={`text-2xl font-bold leading-6 tracking-tight ${is_light ? "text-white" : "text-agap-ink"}`}>
                    AGAP
                </p>
                <p className={`mt-2 text-[11px] leading-[14px] ${is_light ? "text-white/60" : "text-agap-muted"}`}>
                    Alert &amp; Guidance Portal
                </p>
            </div>
        </div>
    );
}
