import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const verifyJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "Unauthorized: Missing Header" });

  const token = header.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Unauthorized: Missing Token" });

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; // Contains sub (userId), email, session metadata
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden: Invalid or Expired Token" });
  }
};
