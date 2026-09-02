import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    const error = new Error("Not authenticated");
    error.status = 401;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub) };
    next();
  } catch {
    const error = new Error("Not authenticated");
    error.status = 401;
    next(error);
  }
}