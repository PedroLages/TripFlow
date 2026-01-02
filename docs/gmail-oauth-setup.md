# Gmail API OAuth2 Setup Guide

> Complete guide for setting up Gmail API OAuth2 integration with Supabase

---

## Overview

TripFlow uses Gmail OAuth2 to securely access user emails and automatically import travel bookings. This guide covers the complete setup process.

## Prerequisites

- Google Cloud Console access
- Supabase project with Auth enabled
- TripFlow app deployed (for OAuth redirect URLs)

---

## Part 1: Google Cloud Console Setup

### Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project:
   - **Project Name**: `TripFlow Email Scanner`
   - **Project ID**: Auto-generated (e.g., `tripflow-email-scanner-123456`)

### Step 2: Enable Gmail API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click **Enable**
4. Wait for API to be enabled (~1 minute)

### Step 3: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Fill in App Information:
   ```
   App name: TripFlow
   User support email: [your-email@example.com]
   Developer contact: [your-email@example.com]
   ```
4. Add **Authorized domains**:
   ```
   tripflow.app (or your domain)
   ```
5. **Scopes** - Add these Gmail scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.metadata
   ```
6. **Test users** (for development):
   - Add your Google account email
   - Add any test user emails

### Step 4: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Configure:
   ```
   Name: TripFlow Web Client

   Authorized JavaScript origins:
   - http://localhost:3000 (for development)
   - https://your-app-domain.com (for production)
   - https://tripflow.app (your production domain)

   Authorized redirect URIs:
   - http://localhost:3000/auth/callback (development)
   - https://your-supabase-project.supabase.co/auth/v1/callback (Supabase)
   - https://tripflow.app/auth/callback (production)
   ```
5. Click **Create**
6. **SAVE THESE CREDENTIALS** (you'll need them):
   ```
   Client ID: xxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxx
   ```

---

## Part 2: Supabase Configuration

### Step 5: Configure Google OAuth Provider

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your TripFlow project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** provider and click **Enable**
5. Enter credentials from Step 4:
   ```
   Client ID: [paste from Google Cloud Console]
   Client Secret: [paste from Google Cloud Console]
   ```
6. **Additional Scopes** (IMPORTANT):
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.metadata
   ```
7. Click **Save**

### Step 6: Set Redirect URLs

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add **Site URL**: `https://tripflow.app` (your production domain)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://tripflow.app/auth/callback
   ```

---

## Part 3: Environment Variables

### Step 7: Update Environment Files

Add to `.env.local` (development):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

Add to `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://tripflow.app
```

---

## Part 4: Edge Function Secrets

### Step 8: Set Gmail API Credentials in Edge Functions

The email-parser Edge Function needs access to Gmail API:

```bash
# Set Edge Function secrets via Supabase CLI
supabase secrets set GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
supabase secrets set GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

Or via Supabase Dashboard:
1. Navigate to **Edge Functions** → **Settings**
2. Add secrets:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## Part 5: Token Encryption

### Step 9: Generate Encryption Key

OAuth tokens must be encrypted before storage:

```bash
# Generate a 256-bit encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to Edge Function secrets:
```bash
supabase secrets set TOKEN_ENCRYPTION_KEY="[generated-key]"
```

---

## Testing the OAuth Flow

### Step 10: Test OAuth Connection

1. Start development server: `npm run dev`
2. Navigate to Documents tab
3. Click "Connect Gmail" button
4. Complete Google OAuth consent flow
5. Verify connection appears in email_connections table
6. Check Supabase logs for any errors

### Expected OAuth Flow:

```
1. User clicks "Connect Gmail"
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. User authorizes Gmail access
   ↓
4. Google redirects to /auth/callback with code
   ↓
5. Frontend exchanges code for tokens via Supabase
   ↓
6. Tokens encrypted and stored in email_connections
   ↓
7. Edge Function can now access Gmail on behalf of user
```

---

## Security Considerations

### Token Security

- **Never log tokens**: Tokens grant full Gmail access
- **Encrypt at rest**: Use TOKEN_ENCRYPTION_KEY for encryption
- **Rotate regularly**: Implement token refresh flow
- **Revoke on disconnect**: Delete tokens when user disconnects

### Rate Limiting

- Gmail API: 250 quota units/user/second
- Batch read operations to stay within limits
- Implement exponential backoff for errors

### Scopes

Only request minimum required scopes:
- `gmail.readonly`: Read email content
- `gmail.metadata`: Read email headers (lighter than full read)

**Never request**:
- `gmail.modify`: Allows deleting/modifying emails
- `gmail.compose`: Allows sending emails

---

## Troubleshooting

### "redirect_uri_mismatch" Error

- Verify redirect URI exactly matches Google Cloud Console configuration
- Check for trailing slashes (http://localhost:3000/ vs http://localhost:3000)
- Ensure protocol matches (http vs https)

### "access_denied" Error

- User declined OAuth consent
- Scopes not approved in OAuth consent screen
- App not verified for production use

### Tokens Not Refreshing

- Refresh token not stored (only granted on first authorization)
- Token refresh logic not implemented
- User revoked app access in Google Account settings

### No Emails Fetched

- Scopes insufficient (need gmail.readonly)
- API quota exceeded
- Connection expired (tokens not refreshed)

---

## Production Checklist

Before deploying to production:

- [ ] OAuth consent screen verified by Google
- [ ] All redirect URIs use HTTPS
- [ ] Environment variables set in production
- [ ] Edge Function secrets configured
- [ ] Token encryption enabled
- [ ] Error logging implemented
- [ ] Rate limiting configured
- [ ] User can revoke access via app UI
- [ ] Privacy policy includes Gmail access disclosure

---

## Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

---

**Last Updated**: 2026-01-01
**Maintained By**: TripFlow Team
