import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// ─── Type Augmentation ─────────────────────────────
// Extend the Express Request type globally so req.user is available
// in all downstream handlers after authentication.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        departmentId: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  departmentId: string;
}

/**
 * requireAuth — Extracts and verifies a Bearer JWT from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, responds with 401 and a specific error message.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authentication required. Please provide an Authorization header.' });
    return;
  }

  // Expect format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid Authorization header format. Expected: Bearer <token>' });
    return;
  }

  const token = parts[1];

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // This is a server config error, not a client error, but we still block access.
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Attach decoded user info so downstream handlers can use req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      departmentId: decoded.departmentId,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please log in again.' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token. Please log in again.' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed. Please log in again.' });
  }
}

/**
 * requireRole — Returns middleware that checks whether the authenticated user
 * has one of the specified roles. Must be used AFTER requireAuth.
 *
 * @param roles - One or more Role enum values that are allowed access.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required before role check.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
