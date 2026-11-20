// PROTOTYPE ONLY: account requests are kept in server memory and are lost on restart.
// Replace with a real database table (and an admin approval screen) before production.

import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { find_user_by_email, role_labels, type user_role } from "./demo_users";

const scrypt_async = promisify(scrypt) as (password: string, salt: Buffer, key_length: number) => Promise<Buffer>;

// Super Admin access is granted internally, so it can't be requested from the public form.
export const requestable_roles = ["cdrrmo", "it_staff"] as const satisfies readonly user_role[];
export type requestable_role = (typeof requestable_roles)[number];

export const requestable_role_options = requestable_roles.map((role) => ({ value: role, label: role_labels[role] }));

export type account_request = {
    id: string;
    full_name: string;
    email: string;
    role: requestable_role;
    employee_id: string;
    password_hash: string; // "salt:hash", both hex
    status: "pending";
    created_at: number;
};

const account_requests: account_request[] = [];

async function hash_password(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await scrypt_async(password, salt, 64);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function is_requestable_role(value: string): value is requestable_role {
    return (requestable_roles as readonly string[]).includes(value);
}

// Returns false when the email already has an account or a pending request.
// Callers should not reveal that to the visitor, so emails can't be probed.
export async function submit_account_request(input: {
    full_name: string;
    email: string;
    role: requestable_role;
    employee_id: string;
    password: string;
}): Promise<boolean> {
    const email = input.email.trim().toLowerCase();
    // Hash before the duplicate check so both paths take the same time.
    const password_hash = await hash_password(input.password);
    const is_taken = find_user_by_email(email) !== null || account_requests.some((request) => request.email === email);
    if (is_taken) return false;

    account_requests.push({
        id: randomUUID(),
        full_name: input.full_name,
        email,
        role: input.role,
        employee_id: input.employee_id,
        password_hash,
        status: "pending",
        created_at: Date.now(),
    });
    return true;
}

export function list_account_requests(): readonly account_request[] {
    return account_requests;
}

// Oldest first, so requests are reviewed in the order they came in.
export function list_pending_account_requests(): account_request[] {
    return account_requests
        .filter((request) => request.status === "pending")
        .sort((first, second) => first.created_at - second.created_at);
}

// Test helper.
export function clear_account_requests() {
    account_requests.length = 0;
}
