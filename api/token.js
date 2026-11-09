const { AccessToken } = require('livekit-server-sdk');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const roomName = req.query.room || 'quiz-raum';
    const participantName = req.query.name || `player-${Math.floor(Math.random() * 1000)}`;

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
  } catch (error) {
    console.error('Token Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
};