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

  // Tausche den Code gegen einen Access Token
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

  const accessToken = tokenData.access_token;
  // Setze den Cookie mit allen Sicherheitsattributen
  const cookie = `token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax`;

  // Bestimme das Ziel
  let redirectUrl;
  if (state && state.trim() !== '') {
    redirectUrl = `https://www.420pharma.de${state}`;
  } else {
    redirectUrl = 'https://www.420pharma.de/fachbereich';
  }

  // Leite weiter und setze den Cookie
  return {
    statusCode: 302,
    headers: {
      'Set-Cookie': cookie,
      Location: redirectUrl,
    },
  };
};
