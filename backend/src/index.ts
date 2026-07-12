import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file before any other imports
// that might depend on them (e.g., Prisma reads DATABASE_URL).
dotenv.config();

import authRoutes from './routes/auth';
import departmentRoutes from './routes/departments';
import configRoutes from './routes/config';
import employeeRoutes from './routes/employees';
import environmentalRoutes from './routes/environmental';
import socialRoutes from './routes/social';
import governanceRoutes from './routes/governance';
import gamificationRoutes from './routes/gamification';
import scoreRoutes from './routes/scores';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import categoryRoutes from './routes/categories';

const app = express();

// ─── CORS Configuration ────────────────────────────
// Allow the Vite frontend dev server on localhost:5173 to make cross-origin
// requests. In production, this should be restricted to the actual domain.
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ───────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecosphere-backend',
  });
});

// ─── Route Mounting ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/environmental', environmentalRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);

// ─── 404 Handler ────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global Error Handler ───────────────────────────
// Express identifies error-handling middleware by having 4 parameters.
// This catches any unhandled errors thrown in route handlers.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An unexpected server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
});

// ─── Start Server ───────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`🌍 EcoSphere backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
