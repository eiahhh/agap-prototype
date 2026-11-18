// PROTOTYPE ONLY: password reset requests are kept in server memory and are lost on restart.
// Replace with a real database table (shown in the IT Staff "Access requests" list) before production.

import { randomUUID } from "node:crypto";

export type password_reset_request = {
    id: string;
    email: string;
    employee_id: string;
    status: "pending";
    created_at: number;
};

const password_reset_requests: password_reset_request[] = [];

// Returns false when this email already has a pending request.
// Callers should not reveal that to the visitor, so emails can't be probed.
export function submit_password_reset_request(input: { email: string; employee_id: string }): boolean {
    const email = input.email.trim().toLowerCase();
    const is_pending = password_reset_requests.some((request) => request.email === email);
    if (is_pending) return false;

    password_reset_requests.push({
        id: randomUUID(),
        email,
        employee_id: input.employee_id.trim().toUpperCase(),
        status: "pending",
        created_at: Date.now(),
    });
    return true;
}

export function list_password_reset_requests(): readonly password_reset_request[] {
    return password_reset_requests;
}

// Test helper.
export function clear_password_reset_requests() {
    password_reset_requests.length = 0;
}
