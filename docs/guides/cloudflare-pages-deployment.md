# Deploying TripFlow to Cloudflare Pages

## Prerequisites
- Cloudflare account
- GitHub repository (your code should be pushed to GitHub)
- Domain registered with Cloudflare (pedrolages.net)

## Step-by-Step Deployment

### 1. Build Configuration

Your app is ready to deploy! The build settings are:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node version**: 18 or higher

### 2. Deploy to Cloudflare Pages

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for Cloudflare Pages deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** in the left sidebar
   - Click **Create a project**
   - Click **Connect to Git**
   - Select your GitHub repository (TripFlow)

3. **Configure Build Settings**:
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: / (leave default)
   ```

4. **Environment Variables** (CRITICAL):
   Click "Add variable" and add:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   Get these from your Supabase project settings.

5. **Deploy**:
   - Click "Save and Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at a Cloudflare Pages URL

### 3. Add Custom Domain (trip.pedrolages.net)

1. **In Cloudflare Pages**:
   - Go to your deployed project
   - Click the **Custom domains** tab
   - Click **Set up a custom domain**
   - Enter: `trip.pedrolages.net`
   - Click **Continue**

2. **DNS Configuration** (Cloudflare does this automatically):
   - Cloudflare will automatically add the DNS records
   - Your domain will be secured with SSL (HTTPS)
   - DNS propagation takes 5-10 minutes

### 4. Update Supabase Redirect URLs

**IMPORTANT**: After deployment, update your Supabase auth redirect URLs:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs**:
   ```
   https://trip.pedrolages.net/#/auth/callback
   https://trip.pedrolages.net
   ```
4. Update **Site URL** to: `https://trip.pedrolages.net`

### 5. Test Your Deployment

1. Visit https://trip.pedrolages.net
2. Test Google OAuth login
3. Verify settings sync (change theme, refresh page)
4. Test creating/editing trips

## Automatic Deployments

Cloudflare Pages automatically redeploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Cloudflare Pages will auto-deploy in 2-3 minutes
```

## Preview Deployments

Every pull request gets its own preview URL:
- Create a new branch
- Push changes
- Create a PR on GitHub
- Cloudflare automatically creates a preview URL

## Performance Benefits

Cloudflare Pages provides:
- ✅ Global CDN (your app loads fast worldwide)
- ✅ Automatic HTTPS/SSL
- ✅ Unlimited bandwidth
- ✅ Auto-scaling (handles traffic spikes)
- ✅ Free tier (generous limits)

## Troubleshooting

### Build Fails
Check the build log in Cloudflare Pages dashboard. Common issues:
- Missing environment variables
- TypeScript errors
- Dependency installation failures

### OAuth Not Working
Make sure you added the redirect URLs to Supabase (step 4 above).

### App Not Loading
Check browser console for errors. Usually environment variable issues.

## Alternative: Deploy to Vercel

If you prefer Vercel instead:
```bash
npm install -g vercel
vercel
# Follow the prompts
```

Then configure your domain in Vercel dashboard.
