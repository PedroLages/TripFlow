# Apple Maps Setup Guide

## Overview
This guide walks through setting up MapKit JS for TripFlow's web application and MapKit for the iOS native app.

## Prerequisites
- Apple Developer Account (free tier works for MapKit JS)
- Node.js backend for token generation
- Modern web browser

---

## Part 1: MapKit JS Setup (Web)

### 1. Create Maps Identifier

1. Go to [Apple Developer Maps](https://developer.apple.com/maps/)
2. Click "Get Started" → "MapKit JS"
3. Sign in with your Apple ID
4. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
5. Click **Identifiers** → **+** (plus button)
6. Select **Maps IDs** → Continue
7. Fill in:
   - **Description**: TripFlow Web Maps
   - **Identifier**: `com.yourcompany.tripflow.web` (reverse domain notation)
8. Click **Continue** → **Register**

### 2. Create MapKit JS Key

1. In the same portal, go to **Keys** → **+** (plus button)
2. Fill in:
   - **Key Name**: TripFlow MapKit JS Key
   - Check **MapKit JS**
3. Click **Continue** → **Register**
4. **IMPORTANT**: Download the `.p8` private key file immediately
   - You can only download it once
   - Save it securely (e.g., `~/Downloads/AuthKey_XXXXXXXXXX.p8`)
5. Note down:
   - **Key ID**: e.g., `ABCD1234EF`
   - **Team ID**: Found in top-right corner (e.g., `TEAM123456`)

### 3. Set Up Environment Variables

Create `.env.local` in your project root:

```bash
# Apple Maps Configuration
VITE_APPLE_MAPS_TEAM_ID=YOUR_TEAM_ID
VITE_APPLE_MAPS_KEY_ID=YOUR_KEY_ID
VITE_APPLE_MAPS_IDENTIFIER=com.yourcompany.tripflow.web

# Private key path (for backend token generation)
APPLE_MAPS_PRIVATE_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
```

**Security Note**:
- Never commit `.p8` private key to git
- Keep private key on server only
- Frontend only needs Team ID, Key ID, and Maps ID

### 4. Install Dependencies

```bash
# For token generation (backend)
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# MapKit JS types (optional, for TypeScript)
npm install --save-dev @types/apple-mapkit-js
```

### 5. Create Token Generation API

MapKit JS requires JWT tokens signed with your private key. Create a backend endpoint:

**File**: `api/mapkit-token.ts` (or Node.js equivalent)

```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

const TEAM_ID = process.env.VITE_APPLE_MAPS_TEAM_ID!;
const KEY_ID = process.env.VITE_APPLE_MAPS_KEY_ID!;
const PRIVATE_KEY_PATH = process.env.APPLE_MAPS_PRIVATE_KEY_PATH!;

export default async function handler(req: Request) {
  // Read private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Generate JWT token (expires in 30 minutes)
  const token = jwt.sign(
    {
      origin: req.headers.get('origin') || 'http://localhost:3001',
    },
    privateKey,
    {
      algorithm: 'ES256',
      expiresIn: '30m',
      issuer: TEAM_ID,
      header: {
        kid: KEY_ID,
        typ: 'JWT',
        alg: 'ES256',
      },
    }
  );

  return new Response(token, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

**Vite Backend Alternative** (for dev):
Create `server/mapkit-token.js`:

```javascript
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3002;

app.get('/api/mapkit-token', (req, res) => {
  const privateKey = fs.readFileSync(process.env.APPLE_MAPS_PRIVATE_KEY_PATH, 'utf8');

  const token = jwt.sign(
    { origin: req.headers.origin || 'http://localhost:3001' },
    privateKey,
    {
      algorithm: 'ES256',
      expiresIn: '30m',
      issuer: process.env.VITE_APPLE_MAPS_TEAM_ID,
      header: {
        kid: process.env.VITE_APPLE_MAPS_KEY_ID,
        typ: 'JWT',
        alg: 'ES256',
      },
    }
  );

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'text/plain');
  res.send(token);
});

app.listen(port, () => {
  console.log(`MapKit token server running at http://localhost:${port}`);
});
```

Run it alongside Vite:
```bash
node server/mapkit-token.js
```

---

## Part 2: MapKit Setup (iOS Native)

### 1. Enable MapKit in Xcode

1. Open your iOS project in Xcode
2. Select your target → **Signing & Capabilities**
3. Click **+ Capability** → Search for **Maps**
4. Add **Maps** capability

### 2. Import MapKit

```swift
import MapKit
import SwiftUI
```

### 3. Request Location Permissions (Optional)

Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>TripFlow needs your location to show nearby places and provide directions.</string>
```

---

## Usage Limits (Free Tier)

MapKit JS free tier includes:

| Service | Daily Limit |
|---------|-------------|
| Map Initializations | 250,000 |
| Geocoding Requests | 25,000 |
| Search Requests | 25,000 |
| Routing Requests | 25,000 |

**Note**: These limits reset daily and are more than sufficient for most apps.

---

## Testing Your Setup

### Test Token Generation

```bash
curl http://localhost:3002/api/mapkit-token
```

You should see a JWT token like:
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0QxMjM0RUYifQ...
```

### Test MapKit JS

Add to your HTML:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js"></script>
</head>
<body>
  <div id="map" style="width: 100%; height: 500px;"></div>
  <script>
    mapkit.init({
      authorizationCallback: (done) => {
        fetch('http://localhost:3002/api/mapkit-token')
          .then(res => res.text())
          .then(token => done(token));
      }
    });

    const map = new mapkit.Map('map', {
      center: new mapkit.Coordinate(37.7749, -122.4194), // San Francisco
      zoom: 12
    });

    console.log('MapKit JS initialized successfully!');
  </script>
</body>
</html>
```

---

## Security Best Practices

1. **Never expose private key** - Keep `.p8` file server-side only
2. **Use environment variables** - Don't hardcode credentials
3. **Validate origin** - Check request origin in token endpoint
4. **Set token expiry** - Use 30-minute expiration (max recommended)
5. **Rate limit token endpoint** - Prevent abuse
6. **Use HTTPS in production** - Encrypt token transmission

---

## Next Steps

1. ✅ Set up Apple Developer credentials
2. ✅ Create token generation endpoint
3. ✅ Test MapKit JS initialization
4. 📝 Migrate MapTab from MapLibre to MapKit JS
5. 📝 Build iOS app with native MapKit
6. 📝 Implement route visualization on both platforms

---

## Troubleshooting

### "Invalid token" Error
- Check that Team ID, Key ID match your Apple Developer portal
- Verify private key path is correct
- Ensure token hasn't expired (30-minute limit)

### CORS Errors
- Add proper CORS headers to token endpoint
- Check origin validation in token generation

### Map Not Loading
- Open browser console and check for errors
- Verify token endpoint is accessible
- Check MapKit JS version in script tag

---

## Resources

- [MapKit JS Documentation](https://developer.apple.com/documentation/mapkitjs)
- [MapKit JS API Reference](https://developer.apple.com/documentation/mapkitjs/mapkit)
- [Apple Maps Dashboard](https://mapsconnect.apple.com/)
- [WWDC Sessions on MapKit](https://developer.apple.com/videos/frameworks/maps-and-location)
