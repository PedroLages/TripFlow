# TripFlow CI/CD Workflow

## Automatic Deployments (Built-in)

When you connect TripFlow to Cloudflare Pages or Vercel, you get automatic CI/CD **for free** - no GitHub Actions needed!

### How It Works

#### 1. Push to Production
```bash
git add .
git commit -m "Update feature"
git push origin main
```

**Result:**
- ✅ Automatic build starts
- ✅ Runs tests (if configured)
- ✅ Builds production bundle
- ✅ Deploys to https://trip.pedrolages.net
- ✅ Email notification when done
- ⏱️  **Time: 2-3 minutes**

#### 2. Preview Deployments (Pull Requests)
```bash
git checkout -b feature/dark-mode
# make changes
git add .
git commit -m "Add dark mode toggle"
git push origin feature/dark-mode
```

Then create a Pull Request on GitHub.

**Result:**
- ✅ Unique preview URL created
- ✅ Comment added to PR with link
- ✅ Test changes before merging
- ✅ Every commit updates preview
- 🔗 **Example**: `tripflow-pr-42.pages.dev`

#### 3. Merge & Deploy
```bash
# On GitHub: Merge PR
# Or locally:
git checkout main
git merge feature/dark-mode
git push origin main
```

**Result:**
- ✅ Production deploy triggered
- ✅ Preview deployment deleted
- ✅ Live in 2-3 minutes

---

## Deployment Status

### Check Status

**Cloudflare Pages:**
- Dashboard: https://dash.cloudflare.com/ → Pages → Your Project
- See: Build logs, deployment history, analytics

**Vercel:**
- Dashboard: https://vercel.com/ → Your Project
- See: Deployments, logs, performance

### Build Notifications

Both platforms send notifications for:
- ✅ Successful deploys
- ❌ Failed builds
- ⏱️  Deploy started
- 📊 Performance insights

Configure in project settings.

---

## Advanced: Custom GitHub Actions (Optional)

While Cloudflare/Vercel handle deployment automatically, you can add GitHub Actions for extra checks:

### Example: Run Tests Before Deploy

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build check
        run: npm run build
```

This runs **in addition to** automatic deployments.

---

## Rollback Strategy

### If something breaks in production:

#### Option 1: Quick Rollback (Dashboard)
1. Go to Cloudflare Pages / Vercel dashboard
2. Click "Deployments"
3. Find previous working version
4. Click "Rollback" or "Promote to Production"
5. ✅ Back online in 30 seconds

#### Option 2: Git Revert
```bash
# Find the bad commit
git log --oneline

# Revert it
git revert <commit-hash>
git push origin main

# Auto-deploys the reverted version
```

#### Option 3: Emergency Fix
```bash
# Make quick fix
git add .
git commit -m "Hotfix: Fix critical bug"
git push origin main

# Deploys in 2-3 minutes
```

---

## Environment Variables

### Auto-sync from Cloudflare/Vercel

When you update environment variables in the dashboard:
- ✅ Changes apply to next deployment
- ✅ Don't need to redeploy manually
- ✅ Preview deployments use preview vars

### Update Process
1. Go to project settings
2. Update environment variable
3. (Optional) Click "Redeploy" for immediate effect
4. Or wait for next `git push`

---

## Monitoring Deployments

### Real-time Build Logs

**Watch live deployment:**
```bash
# Cloudflare Pages
# Visit: https://dash.cloudflare.com/

# Or use Cloudflare CLI (optional)
npm install -g wrangler
wrangler pages deployment tail
```

### Deployment Webhooks

Get notified on:
- Slack
- Discord
- Email
- Custom webhook

Configure in project settings → Notifications.

---

## Performance & Analytics

Both platforms provide:
- 📊 Page load times
- 🌍 Geographic performance
- 📈 Traffic analytics
- 🔍 Error tracking
- 💰 Bandwidth usage

**Free on both platforms!**

---

## Best Practices

### 1. Keep Main Branch Stable
```bash
# Always develop in feature branches
git checkout -b feature/new-thing
# Make changes
git push origin feature/new-thing
# Create PR, test on preview URL
# Only merge when ready
```

### 2. Use Semantic Commit Messages
```bash
git commit -m "feat: Add trip sharing feature"
git commit -m "fix: Resolve date picker bug"
git commit -m "chore: Update dependencies"
```

### 3. Test Locally First
```bash
# Before pushing
npm run build
npm run preview
# Test at http://localhost:4173/
```

### 4. Monitor First Deploy
- Watch build logs
- Test all features
- Check OAuth works
- Verify environment variables

---

## Troubleshooting

### Build Fails

**Check:**
1. Build logs in dashboard
2. Run `npm run build` locally
3. Verify environment variables set
4. Check Node version matches

**Common Issues:**
- Missing env vars
- TypeScript errors
- Dependency issues

### Deploy Succeeds But App Breaks

**Check:**
1. Browser console errors
2. Environment variables (especially Supabase URLs)
3. Redirect URLs in Supabase match your domain
4. CORS settings if using external APIs

---

## Summary

✅ **Zero-config CI/CD** - Just connect GitHub
✅ **Auto-deploy on push** - Every commit to main
✅ **Preview URLs** - Every pull request
✅ **One-click rollback** - If issues arise
✅ **Free forever** - For unlimited deployments
✅ **Global CDN** - Fast worldwide
✅ **Built-in monitoring** - Performance & analytics

**You get enterprise-grade CI/CD for free!** 🚀
