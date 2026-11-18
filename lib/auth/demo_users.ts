// PROTOTYPE ONLY: hardcoded demo accounts, one per role.
// Replace this module with a real user store / auth provider before production.

export type user_role = "cdrrmo" | "super_admin" | "it_staff";

export type demo_user = {
    id: string;
    email: string;
    password: string;
    name: string;
    role: user_role;
};

export const role_labels: Record<user_role, string> = {
    cdrrmo: "CDRRMO Personnel",
    super_admin: "Super Administrator",
    it_staff: "IT Staff",
};

const demo_users: demo_user[] = [
    { id: "u_cdrrmo", email: "cdrrmo@cdrrmo.gov.ph", password: "Cdrrmo@2026", name: "CDRRMO Officer", role: "cdrrmo" },
    { id: "u_admin", email: "admin@cdrrmo.gov.ph", password: "Admin@2026", name: "System Administrator", role: "super_admin" },
    { id: "u_it", email: "it@cdrrmo.gov.ph", password: "ItStaff@2026", name: "IT Staff", role: "it_staff" },
];

export function find_user_by_email(email: string): demo_user | null {
    const normalized_email = email.trim().toLowerCase();
    return demo_users.find((candidate) => candidate.email === normalized_email) ?? null;
}

export function find_user_by_credentials(email: string, password: string): demo_user | null {
    const user = find_user_by_email(email);
    return user && user.password === password ? user : null;
}

export function find_user_by_id(user_id: string): demo_user | null {
    return demo_users.find((candidate) => candidate.id === user_id) ?? null;
}
