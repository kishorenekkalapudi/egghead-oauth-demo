require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const qs = require('querystring');
const JSONWebToken = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

/** Exchange code for a token
 *
 */

// dysfunctional database. DON'T USE
const userDatabase = [];
app.post('/code', async function (req, res) {
  try {
    const token = await exchangeCodeForToken(req.body.code);
    const user = await fetchUser(token);
    const jwt = await encodeJWT(user, token)
    userDatabase.push({jwt, token})
    res.json({jwt});
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get('/repos', async function (req, res) {
  
  try {
    const jwt = req.headers.authorization.split(' ')[1];
    const user = userDatabase.find(u => u.jwt === jwt);
    const token = user.token;
    
    // Throws if JWT was not created with this token
    await verifyJWT(jwt, token)
  
    const repos = await fetchRepos(token);
    res.json(repos)
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

async function exchangeCodeForToken(code) {
  const tokenUrl = 'https://github.com/login/oauth/access_token';
  const oAuthQueryParams = {
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:1234',
    client_id: process.env.ID,
    client_secret: process.env.SECRET,
    code: code,
  };

  const res = await fetch(tokenUrl, {
    body: JSON.stringify(oAuthQueryParams),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await res.text();

  const parsedData = qs.parse(data);
  return parsedData.access_token;
}

async function fetchRepos(token) {
  const url = 'https://api.github.com/user/repos?sort=created&direction=desc';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return data;
}

async function fetchUser(token) {
  const url = 'https://api.github.com/user';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return data;
}

async function encodeJWT(user, token) {
  const jwtPayload = {
    login: user.login,
    id: user.id,
    avatar_url: user.avatar_url
  }
  return JSONWebToken.sign(jwtPayload, token, { expiresIn: '1h' });
}

async function verifyJWT(jwt, token) {
  return JSONWebToken.verify(jwt, token);
}

app.listen(1235, function () {
  console.log('Listening');
});
