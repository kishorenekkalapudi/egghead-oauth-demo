import qs from 'query-string';

const base = 'http://localhost:1234';
const clientId = 'fce8534e0d92f4d6e47b';
const authorizationEndpoint = 'https://github.com/login/oauth/authorize';

/** Get consent
 * 1. Compose a query for the authorize endpoint
 * 2. Attach query to Url
 * 3. Attach Url to button
 */

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

/** Send code to server (only if there's code in query)
 *
 */

const parsedQuery = qs.parseUrl(window.location.href);

if (parsedQuery.query.code) {
  sendCodeToServer();
}

async function sendCodeToServer() {
  const server = 'http://localhost:1235/code';
  try {
    const res = await fetch(server, {
      method: 'POST',
      body: JSON.stringify({
        code: parsedQuery.query.code,
        state: parsedQuery.query.state,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    console.log(data);
    localStorage.setItem('jwt', data.jwt);
    window.location.href = base;
  } catch (error) {
    console.log(error);
  }
}

/** Make an authenticated request
 *
 *
 */

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
