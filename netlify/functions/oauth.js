// netlify/functions/oauth.js

/**
 * DocCheck OAuth2-Flow via Netlify Function
 * Greift auf Umgebungsvariablen DOCCHECK_CLIENT_ID und DOCCHECK_CLIENT_SECRET zu,
 * die du in den Netlify-Einstellungen hinterlegst.
 */

const fetch = require('node-fetch'); 
// Bei Node >= 18 könntest du fetch() direkt nutzen.
// Hier nutzen wir node-fetch, wie in package.json angegeben.

exports.handler = async (event) => {
  // 1) Client-Daten aus Umgebungsvariablen
  const clientId = process.env.DOCCHECK_CLIENT_ID || 'CLIENT_ID_PLATZHALTER';
  const clientSecret = process.env.DOCCHECK_CLIENT_SECRET || 'CLIENT_SECRET_PLATZHALTER';

  // Hier muss deine Netlify-Domain stehen.
  // Diese URL muss auch im DocCheck-Portal als "Redirect-URL" hinterlegt sein.
  const redirectUri = 'https://420pharma.netlify.app/.netlify/functions/oauth';

  // 2) Prüfen, ob die Anfrage einen Code-Parameter enthält
  const { code } = event.queryStringParameters || {};

  // Wenn kein Code -> Weiterleitung zur DocCheck-Anmeldeseite
  if (!code) {
    return {
      statusCode: 302,
      headers: {
        Location: `https://login.doccheck.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`
      }
    };
  }

  // 3) Token anfordern
  const tokenUrl = 'https://login.doccheck.com/oauth/token';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    // Token holen
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await response.json();

    // 4) Wenn wir ein Access Token erhalten:
    if (data.access_token) {
      // Cookie setzen und redirecten
      return {
        statusCode: 302,
        headers: {
          'Set-Cookie': `uniqueKey=${data.access_token}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`,
          // Hier legst du die Zielseite fest, auf die nach erfolgreichem Login geleitet wird:
          Location: 'https://www.420pharma.de/fachbereich'
        }
      };
    } else {
      // Fehlerfall: kein access_token
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication failed', details: data })
      };
    }
  } catch (error) {
    // Allgemeiner Fehler
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};
