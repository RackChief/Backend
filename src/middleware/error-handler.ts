import type {
    ErrorRequestHandler,
} from "express";

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    console.error(error);

    res.status(error.statusCode ?? 500).json({
        error: error.message ?? "Internal Server Error",
    });
};
