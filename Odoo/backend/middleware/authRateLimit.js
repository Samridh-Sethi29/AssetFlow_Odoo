const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    res.set("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    });
  }

  return next();
};

module.exports = authRateLimit;
