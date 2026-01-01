# Setting Up Environment Variables in Cloudflare Pages

Your TripFlow app is deployed, but it needs environment variables to connect to Supabase.

## Quick Setup (5 minutes)

### 1. Go to Cloudflare Pages Dashboard

Visit: https://dash.cloudflare.com/ → **Pages** → **tripflow**

### 2. Add Environment Variables

1. Click on **Settings** (top navigation)
2. Scroll to **Environment variables**
3. Click **Add variables** under "Production (main)"
4. Add these two variables:

```
Variable name: VITE_SUPABASE_URL
Value: https://xnmbvjlhwrukliuzhhvf.supabase.co
```

```
Variable name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWJ2amxod3J1a2xpdXpoaHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTA0NjUsImV4cCI6MjA4Mjc4NjQ2NX0.gF6g_CBzJgn9pKWhgoL63yWD_wljCjFW32B7fEAx3bg
```

5. Click **Save**

### 3. Trigger Redeploy

After saving environment variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Retry deployment**

OR simply push a new commit to trigger auto-deploy:
```bash
git commit --allow-empty -m "Trigger rebuild with env vars"
git push origin main
```

### 4. Verify Deployment

Once the new build completes (2-3 minutes):
- Visit: https://tripflow-3bj.pages.dev
- Try logging in with Google OAuth
- Verify settings sync works

## Add Custom Domain (trip.pedrolages.net)

After environment variables are working:

1. In Cloudflare Pages dashboard → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `trip.pedrolages.net`
4. Cloudflare automatically configures DNS (since your domain is already on Cloudflare)
5. Wait 5-10 minutes for SSL certificate provisioning

## Update Supabase Redirect URLs

**CRITICAL**: After setting up the custom domain:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/xnmbvjlhwrukliuzhhvf/auth/url-configuration
2. Add to **Redirect URLs**:
   ```
   https://trip.pedrolages.net/#/auth/callback
   https://trip.pedrolages.net
   https://tripflow-3bj.pages.dev/#/auth/callback
   https://tripflow-3bj.pages.dev
   ```
3. Update **Site URL** to: `https://trip.pedrolages.net`

## Testing Checklist

After everything is set up:
- [ ] Visit production URL
- [ ] Sign in with Google OAuth
- [ ] Create/edit a trip
- [ ] Change theme in settings
- [ ] Refresh page - verify theme persists
- [ ] Toggle sidebar - verify state persists
- [ ] Check that avatar shows from Google account

## Troubleshooting

**OAuth not working:**
- Make sure you added both the .pages.dev URL AND custom domain to Supabase redirect URLs
- Check browser console for errors

**Settings not syncing:**
- Verify environment variables are set correctly (check for typos)
- Ensure you triggered a redeploy after adding env vars

**Build failing:**
- Check build logs in Cloudflare Pages → Deployments → View build log
- Verify environment variable names start with `VITE_`
