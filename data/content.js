/* --------------------------------------------------
   CLIENT API — PORTFOLIO GREGORY BAUDIN
   Le contenu est servi par l'API sécurisée (/api/content).
   Fallback : cache local si le serveur est injoignable.
   -------------------------------------------------- */

const API_BASE = "";
const CACHE_KEY = "portfolio_baudin_cache_v2";

/**
 * Récupère le contenu du portfolio depuis l'API.
 * Utilise un cache localStorage en secours (mode hors-ligne).
 */
async function fetchPortfolioData() {
    try {
        const res = await fetch(`${API_BASE}/api/content`, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
        return data;
    } catch (err) {
        console.warn("[API] Serveur injoignable, utilisation du cache local.", err.message);
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
        throw new Error("Impossible de charger le contenu du portfolio.");
    }
}
