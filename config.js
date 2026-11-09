// Zentrale Konfiguration für Streaming & Datenbank
const CONFIG = {
    serverIp: "DEINE_HETZNER_IP", 

    // Funktion, um dynamisch die WHIP-URL für jeden Spieler zu holen
    getWhipUrl(playerID) {
        return `http://${this.serverIp}:8889/${playerID}/whip`;
    },

    // Funktion, um dynamisch die WHEP-URL für jeden Spieler zu holen
    getWhepUrl(playerID) {
        return `http://${this.serverIp}:8889/${playerID}/whep`;
    },

    // Supabase-Anbindung
    supabaseUrl: "https://vxnlnmudewvghcoshkux.supabase.co",
    supabaseAnonKey: "sb_publishable_ulMqgspKj8cqBKE5Vydmog_tnyromm0"
};