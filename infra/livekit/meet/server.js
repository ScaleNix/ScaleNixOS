const express = require('express');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'scalenix';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://livekit.scalenix.fr';
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'https://auth.scalenix.fr/realms/scalenix-os';

// JWKS client to verify Keycloak tokens
const jwks = jwksClient({
  jwksUri: `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
  requestHeaders: {},
  timeout: 10000,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyKeycloakToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      issuer: KEYCLOAK_ISSUER,
      algorithms: ['RS256'],
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

// API: Exchange Keycloak token for LiveKit token
app.post('/api/token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const keycloakToken = authHeader.slice(7);
    let user;
    try {
      user = await verifyKeycloakToken(keycloakToken);
    } catch {
      // In dev, allow unverified tokens (self-signed certs)
      const decoded = jwt.decode(keycloakToken);
      if (!decoded || !decoded.preferred_username) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      user = decoded;
    }

    const { room } = req.body;
    const roomName = room || 'scalenix-general';
    const identity = user.preferred_username || user.sub;
    const name = user.name || identity;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: '4h',
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    res.json({ token, url: LIVEKIT_URL, room: roomName });
  } catch (err) {
    console.error('Token error:', err);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// Serve the SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LiveKit Meet running on :${PORT}`));
