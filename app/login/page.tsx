import { Agap_logo } from "@/components/login/agap_logo";
import { Brand_panel } from "@/components/login/brand_panel";
import { Login_form } from "@/components/login/login_form";

export default function login_page() {
    return (
        <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[5fr_6fr]">
            <Brand_panel />

            <section className="flex flex-col items-center justify-center bg-agap-mist px-6 py-10">
                <div className="mb-10 lg:hidden">
                    <Agap_logo tone="dark" />
                </div>
                <Login_form />
            </section>
        </main>
    );
}
