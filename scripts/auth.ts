import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const SESSION_FILE = path.resolve(".supabase-session.json");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required",
    );
}

const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    },
);

type StoredSession = {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
};

async function readSession(): Promise<StoredSession | null> {
    try {
        const contents = await fs.readFile(
            SESSION_FILE,
            "utf8",
        );

        return JSON.parse(contents);
    } catch {
        return null;
    }
}

async function saveSession(
    session: StoredSession,
) {
    await fs.writeFile(
        SESSION_FILE,
        JSON.stringify(session, null, 2),
        {
            mode: 0o600,
        },
    );
}

async function login() {
    if (!email || !password) {
        throw new Error(
            "SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD are required for login",
        );
    }

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password,
        });

    if (error || !data.session) {
        throw error ?? new Error("Login failed");
    }

    await saveSession(data.session);

    return data.session;
}

async function refresh(
    refreshToken: string,
) {
    const { data, error } =
        await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

    if (error || !data.session) {
        return null;
    }

    await saveSession(data.session);

    return data.session;
}

async function main() {
    const existing = await readSession();

    let session =
        existing?.refresh_token
            ? await refresh(existing.refresh_token)
            : null;

    if (!session) {
        session = await login();
    }

    console.log(session.access_token);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
