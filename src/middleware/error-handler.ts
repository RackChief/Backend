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

    if (["23503", "23505", "23514"].includes(error.code)) {
        res.status(409).json({ error: "Inventory constraint conflict" });
        return;
    }
    const status = error.statusCode ?? 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
        error: status >= 500 ? "Internal Server Error" : error.message,
    });
};
