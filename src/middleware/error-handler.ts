import type {
    ErrorRequestHandler,
} from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    if (error instanceof ZodError) {
        res.status(400).json({
            error: "Invalid request",
            issues: error.issues,
        });
        return;
    }

    const databaseError = error?.cause ?? error;
    if (["23503", "23505", "23514", "23P01"].includes(databaseError?.code)) {
        res.status(409).json({ error: "Inventory constraint conflict" });
        return;
    }
    const status = error.statusCode ?? error.status ?? 500;
    if (status >= 500) console.error("Request failed", error instanceof Error ? error.name : "unknown");
    res.status(status).json({
        error: status >= 500 ? "Internal Server Error" : status === 413 ? "Request too large" : error.type === "entity.parse.failed" ? "Malformed JSON" : error.message,
    });
};
