import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),

    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
    BETTER_AUTH_TRUSTED_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173").transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
});

export const env = envSchema.parse(process.env);
