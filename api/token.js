import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const roomName = req.query.room || 'quiz-raum';
  const participantName = req.query.name || `player-${Math.floor(Math.random() * 1000)}`;

  // Standard-Entwicklungsdaten von LiveKit auf Hetzner
  const apiKey = 'devkey';
  const apiSecret = 'secret';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: '2h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return res.status(200).json({ token, identity: participantName });
}