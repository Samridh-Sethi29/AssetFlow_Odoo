const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) return next(err);

  const statusCode = err.name === "ValidationError" ? 400
    : err.name === "MulterError" ? 400
    : err.name === "CastError" ? 400
    : err.code === 11000 ? 409
    : err.statusCode || 500;

  const message = err.name === "ValidationError" ? Object.values(err.errors)
    .map((entry) => entry.message).join(" ")
    : err.code === 11000 ? "A record with that value already exists."
    : err.name === "MulterError" ? err.message
    : statusCode >= 500 ? "Internal Server Error"
    : err.message || "Request failed";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
