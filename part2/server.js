const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { auth } = require("express-openid-connect");
const request = require('request');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// this part is authO
const app = express();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  issuerBaseURL: "https://ee21b128.us.auth0.com",
  authorizationParams: {
    // force the SDK to send the code back in the URL instead of a form post
    response_type: "code",
    response_mode: "query",
    scope: "openid profile email",
  },
};

// // auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// // req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

// google api

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.client_id,
      clientSecret: process.env.client_secret,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would save the user profile to your database
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});


// Authorization Code Flow
app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);
app.get("/profile", (req, res) => {
  res.send(`Hello, ${req.user.displayName}`);
  //   res.send(`Hello again`);
});


// implicit flow
app.get("/auth/google/implicit", (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${process.env.google_client_id}&redirect_uri=${process.env.BASE_URL}/auth/google/implicit/callback&scope=profile%20email`;
  res.redirect(authUrl);
});

app.get("/auth/google/implicit/callback", (req, res) => {
  // Send back an HTML page whose script will grab the fragment
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>OAuth Callback</title></head>
    <body>
      <p>Retrieving access token…</p>
      <script>
        // 1. Strip the leading “#”
        const hash = window.location.hash.substring(1);
        // 2. Parse into key/value pairs
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        // 3a. Display it on the page
        document.body.innerHTML = '<h2>Access Token</h2><pre>' + accessToken + '</pre>';

        // 3b. (Optional) Send it back to your server for storage/verification:
        /*
        fetch('/receive-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken })
        })
        .then(r => console.log('Server received token'))
        .catch(console.error);
        */
      </script>
    </body>
    </html>
  `);
});


app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});


// client-credential flow

app.get('/auth/client-credentials', (req, res) => {
  const options = {
    url: `https://${process.env.domain_url}/oauth/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    json: {
      grant_type: 'client_credentials',
      client_id: process.env.auth_client_id ,        
      client_secret: process.env.auth_client_secret,
      audience: `https://${process.env.domain_url}/api/v2/`     
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      return res.status(500).send(error);
    }
    if (body.error) {
      return res.status(400).send(body);
    }

    res.send(`Access Token: ${body.access_token}`);
  });
});

app.get('/auth/password', (req, res) => {
  const options = {
    url: `https://${process.env.domain_url}/oauth/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      grant_type: 'password',
      client_id: 'seW20O2BYxI5Ow2PziHei6j0oP5OyFJ0',
      client_secret: 'Tef_MXx7vxFr4HPyg4qnmSBJtxCMSRZLwQakUpSfNEOfv2kWWMK2BtUYU8jxAF1i',
      username: 'ee22b100@smail.iitm.ac.in',
      password: 'Rajesh_07',
      audience: `https://${process.env.domain_url}/api/v2/` ,
      scope: 'openid email profile',
      realm: 'Username-Password-Authentication'
    },
    json: true
  };
  

  request(options, (error, response, body) => {
    if (error) return res.status(500).send(error);
    if (body.error) return res.status(400).send(body);

    res.send(`Access Token: ${body.access_token}`);
  });
});

app.listen(3000, () => {

console.log('Server is running on http://localhost:3000');

});