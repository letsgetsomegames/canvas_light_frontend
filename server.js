// server.js
import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
//66666-----
const app = express();
app.use(cookieParser());

const CANVAS_URL = process.env.CANVAS_URL || "https://canvas.instructure.com";
const CLIENT_ID = process.env.CANVAS_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVAS_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth/callback";

// Step 1: Redirect to Canvas login
app.get("/login", (req, res) => {
  const authUrl = `${CANVAS_URL}/login/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
app.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  const tokenRes = await fetch(`${CANVAS_URL}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return res.status(400).send("OAuth failed");

  res.cookie("canvas_token", tokenData.access_token, { httpOnly: true });
  res.redirect("/app");
});

// Step 3: Proxy to Canvas API or HTML
app.get("/api/*", async (req, res) => {
  const token = req.cookies.canvas_token;
  if (!token) return res.status(401).send("Not logged in");

  const url = `${CANVAS_URL}/${req.params[0]}?${new URLSearchParams(req.query).toString()}`;
  const canvasRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const contentType = canvasRes.headers.get("content-type");
  res.set("Content-Type", contentType);
  res.status(canvasRes.status);
  canvasRes.body.pipe(res);
});

// Step 4: Serve app frontend
app.get("/app", (req, res) => {
  res.send(`<html>
  <body>
    <h2>Canvas OAuth Demo</h2>
    <button onclick="window.location='/assignments'">Load Assignments</button>
    <div id="output"></div>
    <script>
      async function loadAssignments() {
        const res = await fetch('/api/api/v1/courses');
        const data = await res.json();
        document.getElementById('output').innerText = JSON.stringify(data, null, 2);
      }
    </script>
  </body>
</html>`);
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
