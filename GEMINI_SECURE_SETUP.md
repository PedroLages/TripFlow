# 🔒 Secure Gemini AI Setup Guide

This guide shows you how to set up Gemini AI with **secure API key storage** using Supabase Edge Functions.

## 🎯 Why This Approach?

**Problem with client-side API keys:**
- ❌ Keys exposed in browser bundle (anyone can steal them)
- ❌ Keys visible in network requests
- ❌ Quota abuse risk
- ❌ Security vulnerability

**Solution with Edge Functions:**
- ✅ API key stored server-side as secret
- ✅ Frontend calls your backend
- ✅ Backend calls Gemini
- ✅ Key never exposed to client

## 📋 Prerequisites

1. **Supabase Project** (you already have one!)
2. **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. **Supabase CLI** installed

## 🚀 Setup Steps

### Step 1: Install Supabase CLI (if not already installed)

```bash
# macOS
brew install supabase/tap/supabase

# or using npm
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

Find your project reference ID from your Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

### Step 4: Set Your Gemini API Key as a Secret

```bash
# Get your API key from: https://aistudio.google.com/app/apikey
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**🔐 Important:** This stores the key securely on Supabase's servers. It's never exposed to the client.

### Step 5: Deploy the Edge Function

```bash
supabase functions deploy gemini-proxy
```

Expected output:
```
Deploying Function gemini-proxy...
✓ Deployed Function gemini-proxy successfully
Function URL: https://YOUR-PROJECT-REF.supabase.co/functions/v1/gemini-proxy
```

### Step 6: Test the Edge Function

```bash
curl -X POST \
  https://YOUR-PROJECT-REF.supabase.co/functions/v1/gemini-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello in 5 words",
    "model": "gemini-2.0-flash-exp"
  }'
```

Expected response:
```json
{
  "text": "Hello there, how are you?"
}
```

## ✅ Verify Setup

1. Check secrets are set:
```bash
supabase secrets list
```

Should show:
```
GEMINI_API_KEY
```

2. Check function is deployed:
```bash
supabase functions list
```

Should show:
```
gemini-proxy
```

## 🔧 Frontend Integration

The frontend code has been updated to use `GeminiService`:

```typescript
import { geminiService } from './services/GeminiService';

// Simple text generation
const tip = await geminiService.generateText({
  prompt: 'Give me a travel tip for Paris',
  model: 'gemini-2.0-flash-exp'
});

// JSON response with schema
const weather = await geminiService.generateJSON({
  prompt: 'What is the weather in Paris?',
  schema: {
    type: 'object',
    properties: {
      temp: { type: 'string' },
      condition: { type: 'string' }
    }
  }
});

// With Google Search (for current data)
const currentWeather = await geminiService.generateWithSearch({
  prompt: 'Current weather in Paris'
});
```

## 🛠️ Updating Components

Components that currently use direct Gemini calls need updating:

### Before (Insecure):
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const response = await ai.models.generateContent({...});
```

### After (Secure):
```typescript
import { geminiService } from '../services/GeminiService';
const text = await geminiService.generateText({
  prompt: 'Your prompt here'
});
```

## 📊 Components to Update

These components currently use direct Gemini calls:

1. **Dashboard.tsx** - AI trip tips
2. **TripDetail.tsx** - Live weather info
3. **BudgetTab.tsx** - Receipt scanning (if implemented)
4. **WishlistTab.tsx** - AI place suggestions
5. **PackingTab.tsx** - AI packing recommendations

## 🔄 Local Development

For local development, you can test Edge Functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions locally (with your API key)
supabase functions serve gemini-proxy --env-file .env.local
```

Create `.env.local`:
```env
GEMINI_API_KEY=your_key_here
```

Frontend will automatically use local function URL when running locally.

## 🚨 Troubleshooting

### Error: "GEMINI_API_KEY not configured"
- Run: `supabase secrets set GEMINI_API_KEY=your_key`
- Redeploy: `supabase functions deploy gemini-proxy`

### Error: "Function not found"
- Check deployment: `supabase functions list`
- Deploy: `supabase functions deploy gemini-proxy`

### CORS errors
- Edge Function includes CORS headers
- Check browser console for specific error
- Verify Supabase URL in `src/lib/supabase.ts`

## 📝 Best Practices

1. **Never commit API keys** to git
2. **Use environment-specific secrets** for dev/staging/prod
3. **Monitor usage** in Google AI Studio dashboard
4. **Implement rate limiting** if needed (add to Edge Function)
5. **Cache responses** when appropriate to save API calls

## 🔗 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets)

---

**Next Steps:** Run the setup commands above, then I'll update your frontend components to use the secure API! 🚀
