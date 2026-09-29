import type {
    NextFunction,
    Request,
    Response,
} from "express";

import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase.js";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({
                error: "Missing authorization token",
            });

            return;
        }

        const token = authHeader.substring("Bearer ".length);

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({
                error: "Invalid or expired authorization token",
            });

            return;
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
}
