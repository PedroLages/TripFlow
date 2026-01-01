# Apple Maps Credentials Checklist

Use this checklist to gather all required credentials before configuring TripFlow.

---

## 📋 Credentials Checklist

### 1. Apple Developer Account
- [ ] Created Apple ID
- [ ] Signed into [developer.apple.com/account](https://developer.apple.com/account)
- [ ] Account active (free tier works fine!)

---

### 2. Maps Identifier
- [ ] Created Maps ID at [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list/mapId)
- [ ] Maps Identifier: `_________________________________`
  - Example: `com.tripflow.web`
  - Use reverse domain notation

---

### 3. MapKit JS Key

⚠️ **CRITICAL**: Private key can only be downloaded ONCE!

- [ ] Created key at [developer.apple.com/account/resources/authkeys](https://developer.apple.com/account/resources/authkeys/list)
- [ ] Checked "MapKit JS" capability
- [ ] Downloaded `.p8` file immediately
- [ ] Key ID: `_________________________________`
  - Example: `9Z8Y7X6W5V`
  - 10 alphanumeric characters
- [ ] File saved to: `_________________________________`
  - Example: `~/Documents/apple-keys/AuthKey_9Z8Y7X6W5V.p8`
  - **NEVER commit this file to git!**

---

### 4. Team ID
- [ ] Found Team ID in top-right corner of developer portal
- [ ] Team ID: `_________________________________`
  - Example: `ABC123DEF4`
  - 10 alphanumeric characters

---

## 🔐 Security Checklist

- [ ] Private key (.p8 file) saved in secure location outside of git repository
- [ ] `.env` file is in `.gitignore` (already configured)
- [ ] Private key file has restricted permissions: `chmod 600 /path/to/key.p8`
- [ ] Backup of private key stored securely (optional but recommended)

---

## ✅ Ready to Configure

When all items above are checked, you have everything needed to configure TripFlow!

**Next Steps**:
1. Create `.env` file with your credentials
2. Test token server: `npm run dev:token`
3. Verify token generation: `curl http://localhost:3002/api/mapkit-token`
4. Test AppleMapDemo: `npm run dev:full` → visit `/map-demo`

---

## 🆘 Help Resources

**If you lost your private key**:
- You must revoke the old key and create a new one
- Go to [Keys](https://developer.apple.com/account/resources/authkeys/list)
- Click on your key → "Revoke"
- Create a new key following Step 3 above

**If you're getting errors**:
- See [apple-maps-setup.md](./apple-maps-setup.md) for troubleshooting
- Check [APPLE_MAPS_IMPLEMENTATION_SUMMARY.md](./APPLE_MAPS_IMPLEMENTATION_SUMMARY.md) for common issues

**Need more help**:
- [MapKit JS Documentation](https://developer.apple.com/documentation/mapkitjs)
- [Apple Developer Forums](https://developer.apple.com/forums/tags/mapkit-js)

---

## 📝 Example Filled Checklist

Here's what your completed checklist might look like:

```
✓ Maps Identifier: com.tripflow.web
✓ Key ID: 9Z8Y7X6W5V
✓ Team ID: ABC123DEF4
✓ Private Key Path: /Users/pedro/Documents/apple-keys/AuthKey_9Z8Y7X6W5V.p8
```

These values will go into your `.env` file as:

```bash
VITE_APPLE_MAPS_TEAM_ID=ABC123DEF4
VITE_APPLE_MAPS_KEY_ID=9Z8Y7X6W5V
VITE_APPLE_MAPS_IDENTIFIER=com.tripflow.web
APPLE_MAPS_PRIVATE_KEY_PATH=/Users/pedro/Documents/apple-keys/AuthKey_9Z8Y7X6W5V.p8
```

---

**Last Updated**: 2025-12-31
**Status**: Ready for credential collection
