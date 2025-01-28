const fetch = require('node-fetch'); 

exports.handler = async (event) => {
  // Tipp: Nutze Environment-Variablen, anstatt hier feste Werte einzutragen
  const clientId = process.env.DOCCHECK_CLIENT_ID || '2000000021573';
  const clientSecret = process.env.DOCCHECK_CLIENT_SECRET || '8078c60cf53d';
  const redirectUri = 'https://deine-seite.netlify.app/.netlify/functions/oauth';

  const { code } = event.queryStringParameters || {};

  if (!code) {
    // Weiterleitung zu DocCheck
    return {
      statusCode: 302,
      headers: {
        Location: `https://login.doccheck.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`
      }
    };
  }

  // Token-URL
  const tokenUrl = 'https://login.doccheck.com/oauth/token';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await response.json();

    if (data.access_token) {
      // Cookie setzen & weiterleiten
      return {
        statusCode: 302,
        headers: {
          'Set-Cookie': `uniqueKey=${data.access_token}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`,
          Location: '/fachbereich/arzt'
        }
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication failed', details: data })
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};
