// Shared Tailwind classes for the sign-in and register forms (values from the Figma auth screens).

export const input_field_class =
    "h-[43.6px] w-full rounded-[10px] border-[0.8px] border-agap-line bg-agap-field px-[13px] text-xs font-medium text-agap-ink " +
    "outline-none transition placeholder:text-agap-ink/50 focus:border-agap-700 focus:ring-2 focus:ring-agap-700/15";

export const error_border_class = "border-red-600 focus:border-red-600 focus:ring-red-600/15";

export const label_class = "text-[11px] font-medium leading-[16.5px] text-agap-muted";

export const inline_link_class = "text-[10px] font-semibold leading-[15px] text-agap-700 underline";

export const error_text_class = "mt-1.5 text-[11px] leading-[16.5px] text-red-700";

export const primary_button_class =
    "flex items-center justify-center gap-[9px] rounded-[10px] bg-agap-700 px-4 font-semibold text-white outline-none " +
    "drop-shadow-[0_7px_10px_rgba(27,94,59,0.18)] transition hover:bg-agap-900 focus-visible:ring-2 " +
    "focus-visible:ring-agap-700/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";

export const checkbox_input_class =
    "peer size-full cursor-pointer appearance-none rounded-[2px] border border-[#767676] bg-white outline-none " +
    "checked:border-agap-700 checked:bg-agap-700 focus-visible:ring-2 focus-visible:ring-agap-700/30";
