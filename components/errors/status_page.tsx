import Link from "next/link";
import { Agap_logo } from "@/components/login/agap_logo";

// Shared layout for the 404 and unauthorized pages.
export function Status_page({
    code,
    title,
    message,
    link_href,
    link_label,
}: {
    code: string;
    title: string;
    message: string;
    link_href: string;
    link_label: string;
}) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-agap-mist px-6 py-10">
            <Agap_logo tone="dark" />
            <section className="w-full max-w-[440px] rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">{code}</p>
                <h1 className="mt-1.5 text-2xl font-normal tracking-[-0.72px] text-agap-ink">{title}</h1>
                <p className="mt-2 text-xs leading-[18px] text-agap-muted">{message}</p>
                <Link
                    href={link_href}
                    className="mt-6 inline-block rounded-[10px] bg-agap-700 px-4 py-3 text-xs font-semibold text-white transition hover:bg-agap-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agap-700/40 focus-visible:ring-offset-2"
                >
                    {link_label}
                </Link>
            </section>
        </main>
    );
}
