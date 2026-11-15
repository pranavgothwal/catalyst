import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security: Disable X-Powered-By to prevent framework disclosure
app.disable('x-powered-by');

// Security: Strict payload size limiter to prevent payload/DoS attacks
app.use(express.json({ limit: '16kb' }));

// Security: Enforce defensive HTTP response headers (CSP, FrameGuard, NoSniff)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://images.unsplash.com https://api.dicebear.com; connect-src 'self';"
  );
  next();
});

// Security: Restrict CORS to trusted local/origin domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'HEAD', 'OPTIONS'],
    credentials: true,
  })
);

// Lightweight In-Memory Rate Limiter (sliding window)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment.',
    });
  }
  next();
};

app.use(rateLimiter);

// Health Check endpoint for Cloud Run / uptime monitors (read-only)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AlwaysWithYOU',
    mode: 'production',
    timestamp: new Date().toISOString(),
  });
});

// Explicit deprecation/lock on mock mutate endpoints to prevent unauthenticated injection
app.all('/api/loops/claim', (req, res) => {
  res.status(403).json({
    success: false,
    error: 'Direct unauthenticated HTTP mutations disabled. Use authenticated client session.',
  });
});

// Serve frontend static build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { maxAge: '1h', etag: true }));

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ error: 'CORS forbidden' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

// Only listen if executed directly, not when imported by test suites
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_ENV && process.argv[1]?.endsWith('server/index.js')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AlwaysWithYOU hardened server listening on port ${PORT}`);
  });
}

export default app;
