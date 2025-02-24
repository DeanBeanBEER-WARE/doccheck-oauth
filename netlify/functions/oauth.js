const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { code, state } = event.queryStringParameters;

  if (!code) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Authorization code missing' }) 
    };
  }

  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;
  const redirect_uri = 'https://420pharma.netlify.app/.netlify/functions/oauth';

  // Token-Austausch: URL-encoded POST Request
  const tokenResponse = await fetch('https://login.doccheck.com/service/oauth/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
      client_secret,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: tokenData.error_description }) 
    };
  }

  // Userdaten abrufen
  const userInfoResponse = await fetch('https://login.doccheck.com/service/oauth/user_data/v2/', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const userInfo = await userInfoResponse.json();

  // Bestimme den Zielpfad:
  let redirectUrl;
  if (state && state.trim() !== '') {
    // Wenn der state-Parameter vorhanden ist, nehmen wir an, er enthält einen relativen Pfad, z. B. "/fachbereich/arzt"
    redirectUrl = `https://www.420pharma.de${state}`;
  } else {
    // Standardziel: Falls der User als Arzt eingestuft wird, weiter zu /fachbereich/arzt, sonst zu /fachbereich
    redirectUrl = 'https://www.420pharma.de/fachbereich';
    if (userInfo.profession === 'doctor') {
      redirectUrl = 'https://www.420pharma.de/fachbereich/arzt';
    }
  }
  
  // Statt eines Cookies leiten wir mit dem Token als URL-Parameter weiter.
  const finalRedirectUrl = `${redirectUrl}?token=${tokenData.access_token}`;
  
  return {
    statusCode: 302,
    headers: {
      Location: finalRedirectUrl,
    },
  };
};
