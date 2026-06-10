import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Environment validation
const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 minutes default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

// ─────────────────────────────────────────────────────────────────────────────
// 1. SECURITY HEADERS (Helmet)
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...ALLOWED_ORIGINS],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: NODE_ENV === "production" ? [] : undefined,
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources if needed
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: NODE_ENV === "production",
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. CORS (Restrictive)
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl requests, etc)
      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin }, "CORS request from unauthorized origin");
        callback(new Error("CORS policy violation"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
    ],
    exposedHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200,
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. RATE LIMITING (General)
// ─────────────────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy, otherwise use IP
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  handler: (req, res) => {
    logger.warn(
      { ip: req.ip, path: req.path },
      "Rate limit exceeded",
    );
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

app.use(globalLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// 4. STRICTER RATE LIMITING FOR AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict for auth
  message: "Too many authentication attempts, please try again later",
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REQUEST SIZE LIMITS
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Strict limit for JSON
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─────────────────────────────────────────────────────────────────────────────
// 6. REQUEST ID & LOGGING
// ─────────────────────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  // Generate or use existing request ID for tracing
  const requestId =
    (req.headers["x-request-id"] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = requestId;
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. STRUCTURED LOGGING (Pino)
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: (req as any).id,
          method: req.method,
          url: req.url?.split("?")[0], // Don't log query strings with sensitive data
          headers: {
            host: req.headers.host,
            "user-agent": req.headers["user-agent"],
          },
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. CLERK PROXY (Before Clerk Middleware)
// ─────────────────────────────────────────────────────────────────────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ─────────────────────────────────────────────────────────────────────────────
// 9. CLERK AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. HEALTH CHECK ENDPOINT (Unprotected, Unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. API ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─────────────────────────────────────────────────────────────────────────────
// 12. 404 HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  (err: Error | any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).id || "unknown";
    const status = err.status || err.statusCode || 500;
    const isOperationalError = err.isOperational || status < 500;

    logger.error(
      {
        error: {
          message: err.message,
          stack: NODE_ENV === "development" ? err.stack : undefined,
          name: err.name,
        },
        requestId,
        path: req.path,
        method: req.method,
      },
      "Request error",
    );

    // Don't expose internal error details in production
    const responseMessage =
      isOperationalError && status !== 500 ? err.message : "Internal server error";

    res.status(status).json({
      error: responseMessage,
      requestId,
      ...(NODE_ENV === "development" && { details: err.message }),
    });
  },
);

export default app;