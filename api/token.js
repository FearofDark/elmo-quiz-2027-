export default async function handler(req, res) {
    // 1. WICHTIG: Erlaube Anfragen von überall (auch von deinem lokalen VS Code Live Server)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const roomName = req.query.room || 'quiz-raum';
        const participantName = req.query.name || 'Zentrale-Viewer';

        // Dein LiveKit API Key & Secret (aus deinen Vercel Environment Variables)
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitHost = 'wss://elmo-quiz.duckdns.org';

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ error: 'LiveKit API Keys nicht konfiguriert' });
        }

        // Token generieren (Beispiel mit livekit-server-sdk falls du Node.js nutzt)
        const at = new window.AccessToken(apiKey, apiSecret, {
            identity: participantName,
        });
        
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();
        return res.status(200).json({ token });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}