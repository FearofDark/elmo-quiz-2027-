import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
    // CORS Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

        // Wenn die Keys auf Vercel fehlen, geben wir jetzt einen klaren JSON-Fehler statt 500 aus
        if (!apiKey || !apiSecret) {
            console.error('FEHLER: LIVEKIT_API_KEY oder LIVEKIT_API_SECRET fehlen auf Vercel!');
            return res.status(500).json({ 
                error: 'Server-Konfigurationsfehler: LIVEKIT_API_KEY oder LIVEKIT_API_SECRET sind in den Vercel Environment Variables nicht gesetzt!' 
            });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: name,
            ttl: '2h',
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
        console.error('Token-Generierungsfehler:', error);
        return res.status(500).json({ error: error.toString() });
    }
}