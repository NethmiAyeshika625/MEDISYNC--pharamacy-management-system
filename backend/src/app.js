import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes.js';
import pharmacyRoutes from './routes/pharmacy.routes.js';
import stockRoutes from './routes/stock.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const configuredOrigins = [
  process.env.CORS_ORIGINS,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .flatMap((value) => value.split(',').map((origin) => origin.trim()))
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

if (allowedOrigins.size === 0) {
  throw new Error('No CORS origins configured. Set CORS_ORIGINS, CLIENT_URL, or FRONTEND_URL.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and same-origin requests with no Origin header.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked for this origin'));
  },
  credentials: true
}));
// Stripe webhook needs the raw body; mount it before json parser
import webhookRoutes from './routes/webhook.routes.js';
app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medisync-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/pharmacies', stockRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);

// Serve public uploaded files only (private uploads such as licenses are served via admin routes)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicUploadsPath = path.join(__dirname, '..', 'uploads', 'public');
app.use('/uploads', express.static(publicUploadsPath));

app.use((err, _req, res, _next) => {
  // Log full error server-side for debugging during development
  // This will make it easier to diagnose 500 responses like login failures.
  // In production, consider removing or gating this behind an env flag.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Server error'
  });
});

export default app;
