/**
 * MapKit JS Token Generation Server
 *
 * Generates JWT tokens for MapKit JS authentication
 * Requires Apple Developer credentials and private key (.p8 file)
 *
 * Run: node server/mapkit-token.js
 * API: http://localhost:3002/api/mapkit-token
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env') });

const app = express();
const PORT = process.env.MAPKIT_TOKEN_PORT || 3002;

// Enable CORS for local development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MapKit Token Server' });
});

// MapKit JS token generation endpoint
app.get('/api/mapkit-token', (req, res) => {
  try {
    // Validate environment variables
    const TEAM_ID = process.env.VITE_APPLE_MAPS_TEAM_ID;
    const KEY_ID = process.env.VITE_APPLE_MAPS_KEY_ID;
    const PRIVATE_KEY_PATH = process.env.APPLE_MAPS_PRIVATE_KEY_PATH;

    if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY_PATH) {
      console.error('Missing required environment variables:');
      console.error('VITE_APPLE_MAPS_TEAM_ID:', TEAM_ID ? '✓' : '✗');
      console.error('VITE_APPLE_MAPS_KEY_ID:', KEY_ID ? '✓' : '✗');
      console.error('APPLE_MAPS_PRIVATE_KEY_PATH:', PRIVATE_KEY_PATH ? '✓' : '✗');

      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Missing Apple Maps credentials. Check .env file.'
      });
    }

    // Read private key file
    let privateKey;
    try {
      privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    } catch (error) {
      console.error('Failed to read private key file:', error.message);
      return res.status(500).json({
        error: 'Private key error',
        message: `Cannot read private key from: ${PRIVATE_KEY_PATH}`,
        hint: 'Ensure the .p8 file exists and path is correct'
      });
    }

    // Get origin from request (for token validation)
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:3001';

    // Generate JWT token
    const token = jwt.sign(
      {
        origin: origin,
        iat: Math.floor(Date.now() / 1000)
      },
      privateKey,
      {
        algorithm: 'ES256',
        expiresIn: '30m', // 30 minutes (max recommended by Apple)
        issuer: TEAM_ID,
        header: {
          kid: KEY_ID,
          typ: 'JWT',
          alg: 'ES256',
        },
      }
    );

    console.log(`[${new Date().toISOString()}] Token generated for origin: ${origin}`);

    // Return token as plain text
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-store'); // Prevent caching
    res.send(token);

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      error: 'Token generation failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  MapKit JS Token Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Token API:  http://localhost:${PORT}/api/mapkit-token`);
  console.log(`  Health:     http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Environment Status:');
  console.log(`  Team ID:    ${process.env.VITE_APPLE_MAPS_TEAM_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  Key ID:     ${process.env.VITE_APPLE_MAPS_KEY_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`  Private Key: ${process.env.APPLE_MAPS_PRIVATE_KEY_PATH ? '✓ Set' : '✗ Missing'}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
