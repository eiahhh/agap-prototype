// Signed session token: base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature).
// Uses Web Crypto only, so it works both in server code and in proxy.ts.

import type { user_role } from "./demo_users";

export const session_cookie_name = "agap_session";

export type session_payload = {
    user_id: string;
    role: user_role;
    expires_at: number; // epoch milliseconds
};

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();

function to_base64url(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function from_base64url(value: string): Uint8Array<ArrayBuffer> {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
}

async function get_signing_key(): Promise<CryptoKey> {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("SESSION_SECRET is missing or too short (need at least 32 characters). Set it in .env.local.");
    }
    return crypto.subtle.importKey("raw", text_encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
        "verify",
    ]);
}

export async function sign_session(payload: session_payload): Promise<string> {
    const body = to_base64url(text_encoder.encode(JSON.stringify(payload)));
    const signature = await crypto.subtle.sign("HMAC", await get_signing_key(), text_encoder.encode(body));
    return `${body}.${to_base64url(new Uint8Array(signature))}`;
}

export async function verify_session(token: string | undefined): Promise<session_payload | null> {
    if (!token) return null;

    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    try {
        const is_valid = await crypto.subtle.verify(
            "HMAC",
            await get_signing_key(),
            from_base64url(signature),
            text_encoder.encode(body),
        );
        if (!is_valid) return null;

        const payload = JSON.parse(text_decoder.decode(from_base64url(body))) as session_payload;
        return payload.expires_at > Date.now() ? payload : null;
    } catch {
        return null;
    }
}
