# TripFlow Deployment Guide

## Quick Deploy to Cloudflare Pages

### Prerequisites
- ✅ Cloudflare account (free)
- ✅ GitHub account
- ✅ Domain on Cloudflare (you have pedrolages.net)

### Step 1: Push to GitHub (if not already done)

```bash
# Initialize git if not already initialized
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Create GitHub repo and push
gh repo create TripFlow --public --source=. --push
# Or manually: create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/TripFlow.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com/
   - Click **Pages** in left sidebar
   - Click **Create a project**

2. **Connect GitHub**
   - Click **Connect to Git**
   - Authorize Cloudflare to access GitHub
   - Select your **TripFlow** repository

3. **Configure Build Settings**
   ```
   Production branch: main
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   ```

4. **Add Environment Variables** (CRITICAL!)
   Click "Environment variables" and add:

   | Variable Name | Value |
   |--------------|--------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

   Get these from: Supabase Dashboard → Project Settings → API

5. **Deploy**
   - Click **Save and Deploy**
   - Wait 2-3 minutes for build
   - You'll get a URL like: `tripflow.pages.dev`

### Step 3: Add Custom Domain

1. **In Cloudflare Pages**
   - Go to your project
   - Click **Custom domains** tab
   - Click **Set up a custom domain**

2. **Add Domain**
   - Enter: `trip.pedrolages.net`
   - Click **Continue**
   - Cloudflare automatically configures DNS
   - SSL certificate issued automatically

3. **Wait 5-10 minutes** for DNS propagation

### Step 4: Update Supabase Auth URLs

**CRITICAL** - Update these in Supabase Dashboard:

1. Go to: **Authentication** → **URL Configuration**

2. **Site URL**: `https://trip.pedrolages.net`

3. **Redirect URLs** (add both):
   ```
   https://trip.pedrolages.net/#/auth/callback
   https://trip.pedrolages.net
   ```

### Done! 🎉

Your app is now live at:
- ✅ https://trip.pedrolages.net
- ✅ Auto-deploys on every `git push`
- ✅ HTTPS/SSL automatic
- ✅ Global CDN (fast worldwide)

---

## Alternative: Vercel (Also Great!)

If you prefer Vercel instead:

### Quick Vercel Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (follow prompts)
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Vercel Dashboard Setup

1. Go to https://vercel.com/
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   ```
5. Add environment variables
6. Deploy!

### Add Custom Domain on Vercel

1. Go to project **Settings** → **Domains**
2. Add: `trip.pedrolages.net`
3. Update DNS at Cloudflare:
   ```
   Type: CNAME
   Name: trip
   Target: cname.vercel-dns.com
   ```

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ 6,000 build minutes/month
- ✅ Custom domains
- ✅ Automatic HTTPS

---

## Comparison: Cloudflare Pages vs Vercel

| Feature | Cloudflare Pages | Vercel |
|---------|------------------|--------|
| **Bandwidth** | ♾️ Unlimited | 100GB/month |
| **Build Minutes** | 500/month | 6,000/month |
| **Deployment Speed** | Fast | Very Fast |
| **Global CDN** | ✅ | ✅ |
| **Custom Domains** | ✅ Free | ✅ Free |
| **Auto HTTPS** | ✅ | ✅ |
| **Preview Deploys** | ✅ | ✅ |
| **Best For** | High traffic, media | Most React apps |
| **Ease of Use** | Medium | Very Easy |
| **Commercial Use** | ✅ Allowed | ⚠️ Restricted on free |

**Recommendation**: Use **Cloudflare Pages** since:
1. You already use Cloudflare for DNS
2. Unlimited bandwidth (no worries)
3. No commercial restrictions
4. Better for scaling later

---

## Automatic Deployments

Both platforms auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Automatically triggers deployment
# Live in 2-3 minutes!
```

---

## Testing Before Going Live

Want to test the build locally first?

```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Test at http://localhost:4173/
```

---

## Troubleshooting

### Build Fails
- Check build logs in dashboard
- Verify environment variables are set
- Test `npm run build` locally first

### OAuth Not Working
- Verify redirect URLs in Supabase include your domain
- Check HTTPS is working
- Clear browser cache

### Slow Loading
- Check if you're using large images
- Enable Cloudflare's image optimization
- Use WebP format for images

---

## What Gets Deployed

From your `dist/` folder after running `npm run build`:
- ✅ Optimized JavaScript (minified, tree-shaken)
- ✅ Optimized CSS (minified)
- ✅ Static assets (images, icons)
- ✅ Service worker (for offline support)
- ✅ PWA manifest

**Build size**: ~500KB (very fast to load!)

---

## Next Steps After Deployment

1. **Test everything**:
   - Google OAuth login
   - Creating trips
   - Updating settings
   - Theme persistence
   - Offline functionality

2. **Monitor**: Both platforms provide analytics

3. **Scale**: Both handle thousands of users on free tier

4. **Update**: Just `git push` to deploy changes!
