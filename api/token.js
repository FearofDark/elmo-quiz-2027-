import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
    // CORS Header setzen, damit der Browser nicht blockiert
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const room = String(req.query.room || 'quiz-raum');
        const name = String(req.query.name || '');

        if (!name) {
            return res.status(400).json({ error: 'Parameter "name" fehlt.' });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('FEHLER: LIVEKIT_API_KEY oder LIVEKIT_API_SECRET sind auf Vercel nicht gesetzt!');
            return res.status(500).json({ error: 'API Keys are missing in Vercel environment variables.' });
        }

        // Token mit LiveKit SDK erstellen
        const at = new AccessToken(apiKey, apiSecret, {
            identity: name,
            ttl: '2h', // Token 2 Stunden gültig
        });

        at.addGrant({
            roomJoin: true,
            room: room,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();
        return res.status(200).json({ token });

    } catch (error) {
        console.error('Token Generation Error:', error);
        return res.status(500).json({ error: error.message });
    }
}