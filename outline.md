# Oauth 2


## 1. Get a client ID and Secret

A client ID and secret is how an Auth server like GH or Google identifies the app that is requesting access to a user's data. You need one before a user can authorize your app.

1. Get a client ID and Secret from GitHub
1. Keep your secret safe. It's the key to your data

## 2. Create a client-client

1. Set a client and a server app
1. Learn that an OAuth client has a client-client and a client-server

```bash
mkdir app && cd app
mkdir client server

cd client
npm init -y
npm i -S query-string
npm i -D parcel@next

cd server
npm init -y
npm i -D nodemon
```

### Structure

```bash
- app
-- client
--- index.html
--- index.js
-- server 
--- server.js
```

## 3 Get Consent from Resource Owner using Code Grant

1. **Resource Owner** is the user that will be authorizing
1. A **code** is what the **Authorization Server** gives you after the resource owner gives consent
1. Use **scope** to tell the resource owner the exact type of data you want access to
1. GitHub will identify you, the developer with the client ID
1. Use state to
    1. Ensure that request was not intercepted since the auth server will send it back to you
    1. Store anything you want to know about your app's state before the user was redirected to the auth server for consent


```javascript
const oAuthQueryParams = {
  response_type: 'code',
  scope: 'user public_repo',
  redirect_uri: base,
  client_id: clientId,
  state: 'blahblah',
};

const query = qs.stringify(oAuthQueryParams);

const authorizationUrl = `${authorizationEndpoint}?${query}`;

const loginLinkEl = document.querySelector('a');

loginLinkEl.setAttribute('href', authorizationUrl);
```


## 4 Create a Client-Server

A client's server is part of the what OAuth considers as a client and is where the client secret is used

1. Create an express server
1. Enable CORS
1. Add a basic route

```js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/code', function (req, res) {
  res.json(req.body);
});

app.listen(1235, function () {
  console.log('Listening');
});

```


## 5 Exchange Code for an Access Token

Getting a user's access token gives you access to their data based on the consent they gave to your app

1. Protect secret by creating a .env and ignoring it in git
1. A `/code` server endpoint that exchanges code for token

```js
app.post('/code', async function (req, res) {
  try {
    const token = await exchangeCodeForToken(req.body.code);
    console.log(token);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
```

## 6 Fetch Protected Data from Resource Server with Token

1. This endpoint returns a auth error because it can't identify which user: https://api.github.com/user
1. Use a token to ID a user and also fetch their data

```js
app.post('/code', async function (req, res) {
  try {
    const token = await exchangeCodeForToken(req.body.code);
+   const user = await fetchUser(token);
    res.json(user);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
```

## 7 Encode User Data with JSON Web Token (JWT)

1. Signing a JWT does not mean it cannot be decoded by everyone
1. Signing protects integrity by telling you if the secret provided is correct when you want verify
1. Use signed JWT for identity by signing and sending to client. Client should persist in local storage

```javascript
+ const userDatabase = [];
app.post('/code', async function (req, res) {
  try {
    const token = await exchangeCodeForToken(req.body.code);
    const user = await fetchUser(token);
+   const jwt = await encodeJWT(user, token)
+   userDatabase.push({jwt, user})
    res.json({jwt});
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
```

## 8 Identify User with JWT

1. Send request with JWT
1. Verify JWT
1. Use an access token associated with JWT to make request

```js
// Server
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
```

```js
// Client
const requestButton = document.querySelector('button');

requestButton.style.display = 'none';

if (localStorage.getItem('jwt')) {
  requestButton.style.display = 'block';
  requestButton.addEventListener('click', function () {
    fetchRepos();
  });
}

async function fetchRepos() {
  const server = 'http://localhost:1235/repos';
  try {
    const res = await fetch(server, {
      headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
    });

    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}
```

## 9. OAuth 2 vs Open ID, Authorization vs Authentication

1. OAuth is for authorization
1. The steps we took to get the access token is Oauth
1. Authentication is using JWT to store credentials on the client and using the credential to ID a user
1. Open ID is the standard that encourages the use of JWT
1. Some companies have an endpoint where you can directly exchange access token for JWT just like we exchanged code for access token
    1. This is Open ID in practice
