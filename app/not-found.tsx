import type { Metadata } from "next";
import { Status_page } from "@/components/errors/status_page";

export const metadata: Metadata = {
    title: "AGAP | Page Not Found",
};

// Shown for any URL that doesn't match a page, and when a page calls notFound().
export default function not_found_page() {
    return (
        <Status_page
            code="404"
            title="Page not found"
            message="The page you're looking for doesn't exist or has been moved."
            link_href="/"
            link_label="Go to home"
        />
    );
}
