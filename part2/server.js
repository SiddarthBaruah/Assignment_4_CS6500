const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { auth } = require("express-openid-connect");
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

app.get("/auth/google/implicit", (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${process.env.client_id}&redirect_uri=${process.env.BASE_URL}/auth/google/implicit/callback&scope=profile email`;
  res.redirect(authUrl);
});

app.get("/auth/google/implicit/callback", (req, res) => {
  const accessToken = req.query.access_token;
  res.send(`Access Token: ${accessToken}`);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
