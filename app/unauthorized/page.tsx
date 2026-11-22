import type { Metadata } from "next";
import { Status_page } from "@/components/errors/status_page";

export const metadata: Metadata = {
    title: "AGAP | Access Denied",
};

// Where signed-in users land when their role can't open a page (see route_access.ts).
export default function unauthorized_page() {
    return (
        <Status_page
            code="403"
            title="Access denied"
            message="Your account doesn't have permission to view this page. Contact your Super Administrator if you think this is a mistake."
            link_href="/dashboard"
            link_label="Back to dashboard"
        />
    );
}
