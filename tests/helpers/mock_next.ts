import { vi } from "vitest";

export type stored_cookie = { value: string; options?: Record<string, unknown> };

// In-memory stand-in for the cookie store returned by next/headers `cookies()`.
export function create_cookie_jar() {
    const store = new Map<string, stored_cookie>();
    return {
        store,
        api: {
            get: (name: string) => (store.has(name) ? { name, value: store.get(name)!.value } : undefined),
            set: (name: string, value: string, options?: Record<string, unknown>) => {
                store.set(name, { value, options });
            },
            delete: (name: string) => {
                store.delete(name);
            },
        },
    };
}

// next/navigation `redirect()` throws to stop execution; mirror that so tests can assert on it.
export function create_redirect_mock() {
    return vi.fn((url: string): never => {
        throw new Error(`NEXT_REDIRECT:${url}`);
    });
}

export function make_form_data(fields: Record<string, string>): FormData {
    const form_data = new FormData();
    for (const [name, value] of Object.entries(fields)) form_data.set(name, value);
    return form_data;
}
