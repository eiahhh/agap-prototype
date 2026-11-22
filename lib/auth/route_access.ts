import { user_roles, type user_role } from "./demo_users";

// Which roles may open each protected route. The longest matching prefix wins,
// so /dashboard/requests is checked before /dashboard. No Next.js imports, so proxy.ts can use it.
export const route_roles: Record<string, readonly user_role[]> = {
    "/dashboard": user_roles,
    "/dashboard/requests": ["super_admin"],
};

function matches_prefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Roles allowed on this path, or null when the path is public.
export function allowed_roles_for(pathname: string): readonly user_role[] | null {
    const prefix = Object.keys(route_roles)
        .filter((candidate) => matches_prefix(pathname, candidate))
        .sort((a, b) => b.length - a.length)[0];
    return prefix ? route_roles[prefix] : null;
}
