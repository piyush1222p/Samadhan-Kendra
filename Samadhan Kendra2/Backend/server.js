import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || "http://127.0.0.1:5500";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(
  cors({
    origin: ORIGIN,
    credentials: true
  })
);
app.use(express.json());

// In-memory demo store
const users = new Map();
let nextUserId = 1000;

function signTokens(user) {
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
  const refreshToken = jwt.sign({ sub: user.id, email: user.email, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, city, phone } = req.body || {};
  if (!firstName || !lastName || !email || !password) return res.status(400).json({ error: "Missing fields" });

  const emailKey = String(email).toLowerCase().trim();
  if (users.has(emailKey)) return res.status(409).json({ error: "User already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `user-${nextUserId++}`,
    firstName,
    lastName,
    email: emailKey,
    city: city || "",
    phone: phone || "",
    passwordHash,
    points: 0,
    joined: new Date().toISOString()
  };
  users.set(emailKey, user);
  const tokens = signTokens(user);
  res.json({ user: { id: user.id, firstName, lastName, email: user.email, city, phone, points: user.points }, ...tokens });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const emailKey = String(email || "").toLowerCase().trim();
  const user = users.get(emailKey);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const tokens = signTokens(user);
  res.json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, city: user.city, phone: user.phone, points: user.points }, ...tokens });
});

app.get("/auth/me", auth, (req, res) => {
  const u = [...users.values()].find((x) => x.id === req.user.sub);
  if (!u) return res.status(404).json({ error: "Not found" });
  res.json({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, city: u.city, phone: u.phone, points: u.points });
});

app.post("/rewards/redeem", auth, (req, res) => {
  const { rewardType, points } = req.body || {};
  const u = [...users.values()].find((x) => x.id === req.user.sub);
  if (!u) return res.status(404).json({ error: "Not found" });
  const cost = Number(points || 0);
  if (u.points < cost) return res.status(400).json({ error: "Insufficient points" });
  u.points -= cost;
  res.json({ ok: true, rewardType, newBalance: u.points });
});

app.post("/issues/:id/upvote", auth, (req, res) => {
  const u = [...users.values()].find((x) => x.id === req.user.sub);
  if (!u) return res.status(404).json({ error: "Not found" });
  u.points += 5; // demo
  res.json({ ok: true, newBalance: u.points });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}. CORS_ORIGIN=${ORIGIN}`);
});