import type { Metadata } from "next";
import { Agap_logo } from "@/components/login/agap_logo";
import { Brand_panel } from "@/components/login/brand_panel";
import { Register_form } from "@/components/register/register_form";
import { requestable_role_options } from "@/lib/auth/account_requests";

export const metadata: Metadata = {
    title: "AGAP | Create Account",
};

export default function register_page() {
    return (
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_6fr]">
            <Brand_panel />

            <section className="flex flex-col items-center justify-center bg-agap-mist px-6 py-10">
                <div className="mb-10 lg:hidden">
                    <Agap_logo tone="dark" />
                </div>
                <Register_form role_options={requestable_role_options} />
            </section>
        </main>
    );
}
