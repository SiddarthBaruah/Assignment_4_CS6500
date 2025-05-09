// test-setup.js
const { OAuth2Server } = require('oauth2-mock-server');

(async () => {
  // 1. Create server
  const server = new OAuth2Server();

  // 2. Generate RSA key for signing tokens
  await server.issuer.keys.generate('RS256');

  // 3. Start on port 8080
  await server.start(8080, 'localhost');
  console.log('Mock OAuth2 server running at:', server.issuer.url);
})();