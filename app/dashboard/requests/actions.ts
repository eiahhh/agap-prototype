"use server";

import { refresh } from "next/cache";
import { review_account_request, type review_decision } from "@/lib/auth/account_requests";
import { require_super_admin } from "@/lib/auth/current_user";

// Actions can be called directly with a POST, not only from the page,
// so each one checks for a Super Admin again instead of trusting the page.
export async function approve_request(form_data: FormData) {
    await review(form_data, "approved");
}

export async function reject_request(form_data: FormData) {
    await review(form_data, "rejected");
}

async function review(form_data: FormData, decision: review_decision) {
    const admin = await require_super_admin();
    const request_id = String(form_data.get("request_id") ?? "");
    if (!request_id) return;

    review_account_request(request_id, decision, admin.id);
    refresh();
}
