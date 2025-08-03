# 🚀 Exotic Arbitrage Bot - Complete Setup Guide

This guide will walk you through setting up and deploying your exotic pairs triangular arbitrage bot from scratch.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Git** installed ([Download](https://git-scm.com/))
- **GitHub** account ([Sign up](https://github.com/))
- **Vercel** account ([Sign up](https://vercel.com/))

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/exotic-arbitrage-bot.git
cd exotic-arbitrage-bot

# Or create from scratch
mkdir exotic-arbitrage-bot
cd exotic-arbitrage-bot
git init
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your preferred editor
nano .env.local
# or
code .env.local
```

### 4. Configure Environment Variables

Add the following to your `.env.local`:

```env
# Required - App Configuration
NEXT_PUBLIC_APP_NAME="Exotic Arbitrage Bot"
NEXT_PUBLIC_MIN_PROFIT_THRESHOLD=0.08
NEXT_PUBLIC_MIN_LIQUIDITY=1500
NEXT_PUBLIC_UPDATE_INTERVAL=8000

# Optional - Real API Keys (for production data)
RAYDIUM_API_KEY=your_raydium_key_here
TRADERJOE_API_KEY=your_traderjoe_key_here
OSMOSIS_API_KEY=your_osmosis_key_here

# Optional - Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your bot!

## 🌐 Production Deployment

### Option 1: One-Click Vercel Deploy (Recommended)

1. **Fork this repository** to your GitHub account
2. **Click the Deploy button** in the README
3. **Connect your GitHub** account to Vercel
4. **Set environment variables** in Vercel dashboard
5. **Deploy automatically**

### Option 2: Manual Vercel Deployment

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Configure Project

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name: `exotic-arbitrage-bot`
- Directory: `./`
- Override settings? **N**

#### Step 4: Set Environment Variables

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_APP_NAME
vercel env add NEXT_PUBLIC_MIN_PROFIT_THRESHOLD
vercel env add NEXT_PUBLIC_MIN_LIQUIDITY

# Add any API keys
vercel env add RAYDIUM_API_KEY
vercel env add TRADERJOE_API_KEY
```

#### Step 5: Deploy to Production

```bash
vercel --prod
```

### Option 3: GitHub Actions (Automated)

#### Step 1: Set GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**:

Add these secrets:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

#### Step 2: Get Vercel Information

```bash
# Get your Vercel token from: https://vercel.com/account/tokens
# Get org and project IDs:
vercel ls
cat .vercel/project.json
```

#### Step 3: Push to Main Branch

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

The GitHub Action will automatically deploy your app!

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **Add domain in Vercel dashboard**
2. **Configure DNS records** as shown by Vercel
3. **Update CORS settings** if needed

### Real API Integration

Replace simulation functions with real API calls:

```typescript
// Example: Real Raydium integration
const fetchRaydiumPrice = async (tokenA: string, tokenB: string) => {
  const response = await fetch(`https://api.raydium.io/v2/main/price`, {
    headers: {
      'Authorization': `Bearer ${process.env.RAYDIUM_API_KEY}`
    }
  });
  return response.json();
};
```

### Database Integration (Optional)

For historical data storage:

```bash
# Add database dependency
npm install @vercel/postgres
# or
npm install mongoose
```

### Monitoring Setup

#### Sentry (Error Tracking)

1. **Create Sentry account**: [sentry.io](https://sentry.io)
2. **Get DSN** from project settings
3. **Add to environment variables**:
   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```

#### Vercel Analytics

```bash
npm install @vercel/analytics
```

Already integrated in the codebase!

### Security Enhancements

#### Rate Limiting

```typescript
// pages/api/health.ts - Add rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

#### API Key Management

Store sensitive keys in Vercel environment variables, never in code:

```bash
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add COINGECKO_API_KEY
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Environment Variables Not Loading

```bash
# Check environment variables
vercel env ls

# Pull latest environment variables
vercel env pull .env.local
```

#### Health Check Failing

```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Test production health endpoint
curl https://your-app.vercel.app/api/health
```

#### Memory Issues

Update `vercel.json`:

```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "memory": 1024
    }
  }
}
```

### Performance Issues

#### Slow API Responses

1. **Implement caching**:
   ```typescript
   const cache = new Map();
   const CACHE_TTL = 30000; // 30 seconds
   ```

2. **Use connection pooling**
3. **Add request timeouts**

#### High Memory Usage

1. **Limit opportunity history**:
   ```typescript
   setOpportunities(prev => [...newOpportunities, ...prev].slice(0, 100));
   ```

2. **Implement data cleanup**
3. **Use streaming for large datasets**

## 📊 Monitoring & Maintenance

### Health Monitoring

Set up uptime monitoring:
- **Pingdom**: [pingdom.com](https://pingdom.com)
- **UptimeRobot**: [uptimerobot.com](https://uptimerobot.com)
- **Better Uptime**: [betteruptime.com](https://betteruptime.com)

Monitor endpoint: `https://your-app.vercel.app/api/health`

### Log Monitoring

```bash
# View Vercel logs
vercel logs

# Follow real-time logs
vercel logs --follow
```

### Performance Monitoring

Use Vercel Analytics dashboard:
- **Core Web Vitals**
- **Real User Monitoring**
- **Performance insights**

## 🔄 Updates & Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix

# Test updates
npm run test
npm run build
```

### Deployment Updates

```bash
# Deploy script
chmod +x scripts/deploy.sh
./scripts/deploy.sh production

# Or manual deployment
git push origin main  # Triggers GitHub Action
# or
vercel --prod
```

### Backup Strategy

1. **Export configuration**:
   ```bash
   vercel env pull .env.backup
   ```

2. **Database backups** (if using)
3. **Git repository backups**

## 🆘 Support

### Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/exotic-arbitrage-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/exotic-arbitrage-bot/discussions)
- **Vercel Support**: [Vercel Help](https://vercel.com/help)

### Documentation

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **TypeScript**: [typescriptlang.org](https://typescriptlang.org)

---

**🎉 Congratulations!** Your exotic arbitrage bot is now deployed and ready to monitor cryptocurrency arbitrage opportunities across multiple chains!

**Next Steps:**
1. Monitor performance in production
2. Set up alerts for high-profit opportunities
3. Integrate with real DEX APIs
4. Add more exotic token pairs
5. Implement automated trading (with caution!)

**⚠️ Disclaimer:** This is a monitoring tool for educational purposes. Always verify calculations and understand risks before executing any trades.