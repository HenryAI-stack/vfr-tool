/**
 * notam-client.js
 * Client-seitiger NOTAM-Abruf für das VFR-Plan-Tool
 *
 * Ablauf:
 * 1. Browser holt Cookie von FAA (direkt, keine CORS-Probleme)
 * 2. Cookie + ICAO-Codes → Cloudflare Worker
 * 3. Worker leitet mit Cookie an FAA weiter → NOTAMs
 */

const WORKER_URL = 'https://notam-worker.henry-ai-server.workers.dev';
const FAA_HOME   = 'https://notams.aim.faa.gov/notamSearch/nsapp.html';

/**
 * Hauptfunktion — NOTAMs für Abflug- und Zielflughafen abrufen
 * @param {string|string[]} icao - ICAO-Code(s) z.B. "EPWA" oder ["EPWA","EPMO"]
 * @returns {Promise<{notams: Array, meta: Object}>}
 */
export async function fetchNotams(icao) {
  const icaoCodes = Array.isArray(icao) ? icao : [icao];

  // Schritt 1: FAA-Session Cookie holen
  // Der Browser darf direkt auf FAA zugreifen (keine CORS-Restriction bei GET)
  let faaCookie = '';
  try {
    faaCookie = await getFaaCookie();
  } catch(err) {
    console.warn('Cookie-Abruf fehlgeschlagen:', err.message);
    // Trotzdem weitermachen — Worker versucht es ohne Cookie
  }

  // Schritt 2: NOTAMs über Worker abrufen
  const response = await fetch(`${WORKER_URL}/notams`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      // Cookie als Custom-Header an Worker schicken
      ...(faaCookie ? { 'X-FAA-Cookie': faaCookie } : {}),
    },
    body: JSON.stringify({ icao: icaoCodes }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * FAA Session-Cookie holen
 * Der Browser ruft die FAA-Seite direkt auf und liest den Cookie
 */
async function getFaaCookie() {
  // Wir laden die FAA-Seite in einem versteckten iframe
  // und lesen den Cookie aus document.cookie
  // (funktioniert weil FAA kein HttpOnly für den BIG-IP Cookie setzt)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('FAA Cookie Timeout'));
    }, 10000);

    // Option A: fetch mit credentials (holt Cookie automatisch)
    fetch('https://notams.aim.faa.gov/notamSearch/', {
      method:      'GET',
      credentials: 'include', // Browser speichert Cookie automatisch
      mode:        'no-cors', // FAA erlaubt kein CORS — aber Cookie wird gesetzt
    })
    .then(() => {
      clearTimeout(timeout);
      // Cookie ist jetzt im Browser gespeichert
      // Beim nächsten Request wird er automatisch mitgeschickt
      // Wir lesen ihn aus document.cookie (falls nicht HttpOnly)
      const cookie = document.cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('BIGip') || c.startsWith('JSESSIONID') || c.startsWith('DR_S'));

      resolve(cookie || '');
    })
    .catch(err => {
      clearTimeout(timeout);
      // no-cors fetch wirft keinen Fehler — dieser Catch ist für echte Netzwerkfehler
      resolve('');
    });
  });
}

/**
 * Hilfsfunktion — NOTAMs für einen VFR-Plan abrufen
 * @param {Object} vfrPlan - { departure: {icao}, destination: {icao}, alternates: [{icao}] }
 */
export async function fetchNotamsForPlan(vfrPlan) {
  const icaos = [
    vfrPlan.departure?.icao,
    vfrPlan.destination?.icao,
    ...(vfrPlan.alternates?.map(a => a.icao) ?? []),
  ].filter(Boolean);

  if (icaos.length === 0) return { notams: [], meta: {} };

  const result = await fetchNotams(icaos);

  // NOTAMs nach ICAO gruppieren
  const grouped = {};
  for (const icao of icaos) {
    grouped[icao] = result.notams.filter(n =>
      n.facilityDesignator === icao ||
      n.icaoId === icao ||
      n._icao === icao
    );
  }

  return {
    ...result,
    grouped,
  };
}
