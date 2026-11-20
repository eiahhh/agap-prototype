import type { Metadata } from "next";
import { Agap_logo } from "@/components/login/agap_logo";
import { Brand_panel } from "@/components/login/brand_panel";
import { Forgot_password_form } from "@/components/forgot_password/forgot_password_form";

export const metadata: Metadata = {
    title: "AGAP | Reset Password",
};

export default function forgot_password_page() {
    return (
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_6fr]">
            <Brand_panel />

            <section className="flex flex-col items-center justify-center bg-agap-mist px-6 py-10">
                <div className="mb-10 lg:hidden">
                    <Agap_logo tone="dark" />
                </div>
                <Forgot_password_form />
            </section>
        </main>
    );
}
