const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Authorization code missing' }),
    };
  }

  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;
  const redirect_uri = 'https://420pharma.netlify.app/.netlify/functions/oauth';

  // 1) Tausche den code gegen einen Access Token
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
      body: JSON.stringify({ error: tokenData.error_description }),
    };
  }

  // 2) (Optional) Userinfo abrufen, falls du zusätzliche Infos brauchst
  //    Hier nur, wenn du noch das Profil abfragen willst.
  /*
  const userInfoResponse = await fetch('https://login.doccheck.com/service/oauth/user_data/v2/', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userInfoResponse.json();
  */

  // 3) Bestimme das Ziel (based on "state" or fallback)
  let redirectUrl;
  if (state && state.trim() !== '') {
    // z.B. state="/fachbereich/arzt"
    redirectUrl = `https://www.420pharma.de${state}`;
  } else {
    // Standard: "/fachbereich"
    redirectUrl = 'https://www.420pharma.de/fachbereich';
  }

  // 4) Setze den Token als Cookie statt ihn an die URL anzuhängen
  const cookie = `token=${tokenData.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`;

  // 5) Weiterleitung
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': cookie,
      Location: redirectUrl,
    },
  };
};
