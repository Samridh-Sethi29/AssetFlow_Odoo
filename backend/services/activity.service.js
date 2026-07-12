const Activity = require("../models/Activity");

/**
 * Fire-and-forget activity logger. Never throws — a logging failure
 * should never break the primary request.
 */
const logActivity = async ({ userId, module, action, description, req }) => {
    try {
        await Activity.create({
            user: userId,
            module,
            action,
            description,
            ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
        });
    } catch (error) {
        console.error("Activity log failed:", error.message);
    }
};

module.exports = { logActivity };
