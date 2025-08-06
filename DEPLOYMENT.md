# 🚀 Hotel Review Generator - Deployment Guide

Complete deployment guide for the Hotel Review Generator with multiple deployment options and production-ready configurations.

## 📋 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Deployment Options

### 1. Netlify (Recommended)
**Best for**: Static hosting with CDN, forms, and serverless functions

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

**Configuration**: `netlify.toml`
- Automatic HTTPS
- Global CDN
- Form handling
- Branch previews
- Performance optimizations

### 2. Vercel
**Best for**: Frontend-focused deployments with edge functions

```bash
# Deploy to Vercel
./scripts/deploy.sh vercel
```

**Features**:
- Zero-config deployments
- Edge network
- Analytics included
- Git integration

### 3. Docker Deployment
**Best for**: Self-hosted or cloud container deployments

```bash
# Development
docker-compose up app-dev

# Production
docker-compose up app-prod

# With load balancer
docker-compose up nginx app-prod
```

**Images**:
- `hotel-review-generator:dev` - Development with hot reload
- `hotel-review-generator:prod` - Production with nginx
- `hotel-review-generator:test` - Testing environment

### 4. Static File Server
**Best for**: Simple hosting or CDN deployment

```bash
# Build and serve
npm run build
npm run serve

# Or use any static server
python -m http.server 8000 -d dist
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Production deployment
export NODE_ENV=production
export NETLIFY_SITE_ID=your_site_id
export NETLIFY_AUTH_TOKEN=your_auth_token

# Optional integrations
export SLACK_WEBHOOK_URL=your_webhook_url
export SENTRY_DSN=your_sentry_dsn
```

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.js` | Build configuration |
| `netlify.toml` | Netlify deployment settings |
| `Dockerfile` | Container configuration |
| `docker-compose.yml` | Multi-service setup |

## 🧪 Testing & Quality Assurance

### Test Suite
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Validate build
npm run validate
```

### Performance Testing
```bash
# Lighthouse audit
npm run lighthouse

# Accessibility testing
npm run a11y
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Lighthouse CI**: Automated performance testing
- **Core Web Vitals**: Real user metrics
- **Bundle Analysis**: Code splitting optimization

### Error Tracking
```javascript
// Optional Sentry integration
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

### Analytics Integration
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔐 Security Configuration

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
```

### Security Headers
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS Enforcement
All deployments automatically redirect HTTP to HTTPS and include HSTS headers.

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/ci.yml`

**Stages**:
1. **Quality**: Linting, testing, security audit
2. **Build**: Application build and performance testing
3. **Deploy**: Staging/production deployment
4. **Monitor**: Post-deployment health checks

**Triggers**:
- Push to `main` → Production deployment
- Push to `develop` → Staging deployment
- Pull requests → Quality checks only

### Deployment Scripts
```bash
# Manual deployments
./scripts/deploy.sh staging
./scripts/deploy.sh production

# Health checks
./scripts/deploy.sh health

# Rollback (production only)
./scripts/deploy.sh rollback
```

## 🏥 Health Checks & Monitoring

### Application Health
```bash
# Docker health check
curl http://localhost:8080/health

# Netlify health check
curl https://hotel-review-generator.com/
```

### Performance Thresholds
- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90

### Uptime Monitoring
Use services like:
- Pingdom
- UptimeRobot
- StatusCake
- DataDog

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Performance Issues**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check network performance
npm run lighthouse
```

**Deployment Failures**
```bash
# Check logs
netlify logs
docker logs hotel-review-generator

# Verify configuration
npm run validate
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
npm run dev

# Or add ?debug=true to URL
http://localhost:3000?debug=true
```

## 📈 Performance Optimization

### Build Optimizations
- **Code Splitting**: Automatic chunking
- **Tree Shaking**: Dead code elimination
- **Minification**: Terser compression
- **Asset Optimization**: Image compression

### Runtime Optimizations
- **Service Worker**: Offline caching
- **Lazy Loading**: On-demand resources
- **CDN**: Global content delivery
- **Compression**: Gzip/Brotli

### Mobile Optimizations
- **Critical CSS**: Above-the-fold inlining
- **Touch Optimization**: 44px minimum targets
- **Viewport**: Responsive design
- **Performance Budget**: < 2s load time

## 🔄 Backup & Recovery

### Automated Backups
Production deployments automatically create backups before updating.

```bash
# Manual backup
mkdir backups
tar -czf "backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz" dist/

# Restore from backup
./scripts/deploy.sh rollback
```

### Disaster Recovery
1. **Code**: Git repository with full history
2. **Builds**: CI/CD artifacts (30-day retention)
3. **Deployment**: Netlify deployment history
4. **Configuration**: Infrastructure as code

## 📞 Support & Maintenance

### Regular Maintenance
- **Dependencies**: Monthly security updates
- **Performance**: Quarterly audits
- **Content**: Ongoing content updates
- **Monitoring**: 24/7 automated monitoring

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and APIs
- **Community**: Discord/Slack channels
- **Enterprise**: Priority support available

---

## 🎯 Quick Deployment Checklist

- [ ] Environment variables configured
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Security audit clean (`npm audit`)
- [ ] Performance thresholds met (`npm run lighthouse`)
- [ ] Accessibility validated (`npm run a11y`)
- [ ] Deployment script tested (`./scripts/deploy.sh staging`)
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place

**Ready to deploy!** 🚀