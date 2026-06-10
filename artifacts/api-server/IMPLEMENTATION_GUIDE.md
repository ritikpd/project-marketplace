# Security Implementation Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd artifacts/api-server
pnpm install
```

New security dependencies installed:
- `helmet`: Security headers (^7.1.0)
- `express-rate-limit`: Rate limiting (^7.1.5)

### 2. Environment Configuration
```bash
cp .env.example .env.production
```

Edit `.env.production`:
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://nepzia.example.com,https://app.nepzia.example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DATABASE_URL=postgresql://...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### 3. Build
```bash
pnpm run build
```

### 4. Test
```bash
pnpm run dev       # Development mode
# or
NODE_ENV=production pnpm start  # Production mode
```

---

## Configuration Options

### CORS Configuration
```env
# Comma-separated list (NO SPACES)
ALLOWED_ORIGINS=https://nepzia.example.com,https://app.nepzia.example.com
```

### Rate Limiting
```env
# Window duration in milliseconds (default: 15 minutes = 900000)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Testing Security

### CORS Testing
```bash
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/api/listings
```

### Rate Limiting
```bash
for i in {1..150}; do curl http://localhost:3000/api/listings; done
```

### Input Validation
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{"price": -100}'
```

### Security Headers
```bash
curl -i http://localhost:3000/health
```

---

## Files Changed

### Modified Files
- `artifacts/api-server/src/app.ts` - Complete security hardening
- `artifacts/api-server/src/routes/listings.ts` - SQL injection fixes
- `artifacts/api-server/src/middlewares/requireAuth.ts` - Enhanced auth
- `artifacts/api-server/package.json` - Added dependencies

### New Files
- `artifacts/api-server/src/middlewares/validation.ts` - Validation helpers
- `artifacts/api-server/src/lib/security.ts` - Security utilities
- `artifacts/api-server/.env.example` - Config template
- `artifacts/api-server/SECURITY.md` - Security docs
- `artifacts/api-server/IMPLEMENTATION_GUIDE.md` - This guide

---

## Troubleshooting

### CORS errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Add frontend domain to `ALLOWED_ORIGINS`

### 429 Too Many Requests
```
Too many requests from this IP
```
**Solution**: Increase `RATE_LIMIT_MAX_REQUESTS` or investigate attack

### 400 Validation Error
```json
{
  "error": "Validation error",
  "details": {"price": ["Invalid value"]}
}
```
**Solution**: Check Zod schemas and send valid data