// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { sign_session, verify_session, type session_payload } from "@/lib/auth/session_token";

const hour_ms = 60 * 60 * 1000;

function base64url_json(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function valid_payload(overrides: Partial<session_payload> = {}): session_payload {
    return { user_id: "u_cdrrmo", role: "cdrrmo", expires_at: Date.now() + hour_ms, ...overrides };
}

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("session token", () => {
    it("verifies a token it signed and returns the payload", async () => {
        const payload = valid_payload();
        const token = await sign_session(payload);

        expect(await verify_session(token)).toEqual(payload);
    });

    it("rejects a token whose payload was edited (e.g. role raised to super_admin)", async () => {
        const token = await sign_session(valid_payload());
        const [, signature] = token.split(".");
        const forged_body = base64url_json(valid_payload({ user_id: "u_admin", role: "super_admin" }));

        expect(await verify_session(`${forged_body}.${signature}`)).toBeNull();
    });

    it("rejects a token whose signature was changed", async () => {
        const token = await sign_session(valid_payload());
        const [body, signature] = token.split(".");
        const flipped = (signature[0] === "A" ? "B" : "A") + signature.slice(1);

        expect(await verify_session(`${body}.${flipped}`)).toBeNull();
    });

    it("rejects an expired token", async () => {
        const token = await sign_session(valid_payload({ expires_at: Date.now() - 1000 }));

        expect(await verify_session(token)).toBeNull();
    });

    it("rejects a token signed with a different secret", async () => {
        vi.stubEnv("SESSION_SECRET", "a-completely-different-secret-0123456789xyz");
        const token = await sign_session(valid_payload());
        vi.unstubAllEnvs();

        expect(await verify_session(token)).toBeNull();
    });

    it.each([undefined, "", "garbage", "only-one-part", ".", "a.b", "!!!.???"])(
        "rejects malformed token %j without throwing",
        async (token) => {
            expect(await verify_session(token)).toBeNull();
        },
    );

    it("refuses to sign when SESSION_SECRET is missing or too short", async () => {
        vi.stubEnv("SESSION_SECRET", "too-short");

        await expect(sign_session(valid_payload())).rejects.toThrow("SESSION_SECRET");
    });
});
