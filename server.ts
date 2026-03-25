import "dotenv/config";
import express from "express";
console.log("server.ts loading: imports starting...");
import path from "path";
import { fileURLToPath } from "url";
// // import { google } from "googleapis";
import cookieSession from "cookie-session";
import crypto from "crypto";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { createClient } from "@libsql/client";
import { getGoogle } from "./src/lib/google.js";
console.log("server.ts loading: imports finished.");

let dbInstance: any = null;
function getDb() {
  if (!dbInstance) {
    const url = process.env.TURSO_URL || "file:local.db";
    const authToken = process.env.TURSO_AUTH_TOKEN || "";
    
    console.log(`[DB DEBUG] CWD: ${process.cwd()}`);
    console.log(`[DB DEBUG] Connecting to database at: ${url.includes("file:") ? "local file" : url.substring(0, 15) + "..."}`);
    
    dbInstance = createClient({
      url,
      authToken,
    });
  }
  return dbInstance;
}

// Initialize database tables
let dbPromise: Promise<void> | null = null;
async function initDb() {
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    try {
      console.log("Initializing database tables...");
      const start = Date.now();
      const client = getDb();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          email TEXT,
          name TEXT,
          photo TEXT,
          terms_accepted BOOLEAN DEFAULT FALSE
        )
      `);
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS pending_sessions (
          token TEXT PRIMARY KEY,
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS oauth_states (
          state TEXT PRIMARY KEY,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);
      console.log(`Database tables initialized successfully in ${Date.now() - start}ms.`);
      
      // Verify table exists
      const verify = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='oauth_states'");
      console.log(`[DB DEBUG] oauth_states table exists: ${verify.rows.length > 0}`);
    } catch (err) {
      console.error("Error initializing database:", err);
      dbPromise = null; // Allow retry on next call
    }
  })();
  
  return dbPromise;
}

// Start DB init in background immediately
console.log("server.ts loading: calling initDb...");
initDb().then(() => {
  console.log("server.ts loading: initDb promise returned (success).");
}).catch(err => {
  console.error("CRITICAL: Failed to initialize database on startup:", err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

// Helper to get fresh credentials
const getGoogleCredentials = () => {
  return {
    clientId: (process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || "").trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET || "").trim()
  };
};

const getGoogleInstance = async () => {
  return getGoogle();
};

const SESSION_SECRET = process.env.SESSION_SECRET || "beatgangsta-secret-123";
const APP_URL = (process.env.APP_URL || "").trim();

console.log(`Startup: APP_URL is set to "${APP_URL}"`);

if (GOOGLE_CLIENT_ID) {
  console.log(`Google OAuth Client ID detected: ${GOOGLE_CLIENT_ID.substring(0, 10)}...`);
} else {
  console.warn("Google OAuth Client ID is missing!");
}

const getRedirectUri = (req: express.Request) => {
  // Priority 1: Fallback to request headers (useful for dynamic dev/preview environments)
  const hostHeader = req.headers["x-forwarded-host"] || req.get("host") || "";
  const protocolHeader = req.headers["x-forwarded-proto"] || (hostHeader.includes("localhost") ? "http" : "https");
  
  const cleanHost = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(',')[0].trim();
  const cleanProtocol = (Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader).split(',')[0].trim();
  const finalProtocol = (!cleanHost.includes("localhost")) ? "https" : cleanProtocol;

  console.log(`[AUTH DEBUG] cleanHost: ${cleanHost}, cleanProtocol: ${cleanProtocol}, finalProtocol: ${finalProtocol}`);

  // ENSURE CONSISTENCY: Use the current host to avoid cross-origin issues with window.opener
  if (cleanHost.includes("beatgangsta.com")) {
    const uri = `https://${cleanHost}/api/auth/google/callback`;
    console.log(`[AUTH DEBUG] Redirect URI (Main Domain): ${uri}`);
    return uri;
  }

  // If we are on a .run.app or localhost, we should use the current host to ensure the redirect comes back to THIS instance
  if (cleanHost.includes(".run.app") || cleanHost.includes("localhost")) {
    const uri = `${finalProtocol}://${cleanHost}/api/auth/google/callback`;
    console.log(`[AUTH DEBUG] Redirect URI (Dev/Preview): ${uri}`);
    return uri;
  }

  // Final fallback to the current host
  if (cleanHost) {
    const uri = `${finalProtocol}://${cleanHost}/api/auth/google/callback`;
    console.log(`[AUTH DEBUG] Redirect URI (Fallback): ${uri}`);
    return uri;
  }

  // Priority 3: Hardcoded fallback
  const fallbackUri = `https://www.beatgangsta.com/api/auth/google/callback`;
  console.log(`[AUTH DEBUG] Redirect URI (Hardcoded Fallback): ${fallbackUri}`);
  return fallbackUri;
};

const app = express();
console.log("Express app initialized.");

app.set('trust proxy', 1);

// Force HTTPS and WWW for beatgangsta.com to ensure session consistency
app.use((req, res, next) => {
  const host = req.get('host') || "";
  const protocol = req.get('x-forwarded-proto') || req.protocol;

  const isHttp = protocol !== 'https' && !host.includes('localhost');
  const isApex = host === 'beatgangsta.com';

  // If it's HTTP or the apex domain, do a single-hop redirect to the correct HTTPS destination
  if (isHttp || isApex) {
    const targetHost = isApex ? 'www.beatgangsta.com' : host;
    return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
  }

  next();
});

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:", "http:"],
      "connect-src": ["'self'", "https://challenges.cloudflare.com", "https://*.googleapis.com", "https://*.run.app"],
      "frame-src": ["'self'", "https://challenges.cloudflare.com", "https://*.run.app"],
      "script-src": ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some external assets/iframes
  crossOriginOpenerPolicy: false, // CRITICAL: Allow popups to keep window.opener for OAuth communication
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "https://www.beatgangsta.com",
      "https://beatgangsta.com",
      "https://ais-dev-yqxmqinasfzdo4mj6wvj6s-135148607567.us-west1.run.app",
      "https://ais-pre-yqxmqinasfzdo4mj6wvj6s-135148607567.us-west1.run.app"
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes("localhost") || origin.endsWith(".run.app")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use(globalLimiter);

// Sensitive API Rate Limiting (AI & Auth)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 1000, // Increased from 100 to 1000 to accommodate polling and prevent lockout
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: "Rate limit exceeded for sensitive operations. Please try again in an hour." }
});

// Remove the Partitioned hack as it might be interfering with session cookies
// and is only needed for cross-site iframe support which we can handle with SameSite=None
// Middleware to determine cookie domain and ensure Partitioned attribute is added
app.use((req, res, next) => {
  const host = req.get('host') || "";
  const isMainDomain = host.includes("beatgangsta.com");
  
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name: string, value: any) {
    if (name.toLowerCase() === 'set-cookie') {
      const processCookie = (v: string) => {
        if (typeof v === 'string' && v.includes('session=')) {
          let newValue = v;
          if (!v.includes('Partitioned')) {
            newValue = `${newValue}; Partitioned`;
          }
          if (isMainDomain && !v.includes('Domain=')) {
            newValue = `${newValue}; Domain=.beatgangsta.com`;
          }
          return newValue;
        }
        return v;
      };

      if (typeof value === 'string') {
        value = processCookie(value);
      } else if (Array.isArray(value)) {
        value = value.map(v => typeof v === 'string' ? processCookie(v) : v);
      }
    }
    return originalSetHeader.call(this, name, value);
  };
  next();
});

app.use(cookieSession({
  name: 'session',
  keys: [SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours is enough for OAuth
  secure: true,
  sameSite: 'none',
  httpOnly: true,
}));

app.use(express.json({ limit: '50mb' }));

// --- Honey Pot Trap for Bots ---
app.get("/api/trap", (req, res) => {
  const userAgent = req.headers["user-agent"] || "unknown";
  console.log(`[HONEYPOT] Bot trapped! IP: ${req.ip}, UA: ${userAgent}`);
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  const words = ["beat", "gangsta", "producer", "studio", "rap", "hip-hop", "trap", "music", "audio", "mastering", "mixing", "vocals", "lyrics", "rhyme", "flow", "rhythm", "bass", "drums", "synth", "melody", "harmony", "track", "album", "single", "release", "artist", "label", "contract", "royalties", "publishing", "distribution", "streaming", "playlist", "chart", "hit", "legend", "icon", "star", "fame", "success", "money", "power", "respect", "loyalty", "hustle", "grind", "dream", "vision", "future", "past", "present", "life", "death", "love", "hate", "peace", "war", "street", "hood", "city", "world", "universe", "god", "devil", "angel", "demon", "soul", "spirit", "mind", "body", "heart", "blood", "sweat", "tears", "pain", "joy", "sorrow", "hope", "fear", "truth", "lie", "justice", "crime", "law", "order", "chaos", "freedom", "slavery", "king", "queen", "prince", "princess", "knight", "warrior", "soldier", "general", "president", "leader", "follower", "master", "slave", "teacher", "student", "wise", "fool", "rich", "poor", "strong", "weak", "fast", "slow", "high", "low", "hot", "cold", "light", "dark", "day", "night", "sun", "moon", "stars", "sky", "earth", "water", "fire", "air", "wind", "rain", "snow", "storm", "thunder", "lightning", "ocean", "sea", "river", "lake", "mountain", "valley", "forest", "desert", "jungle", "island", "continent", "planet", "galaxy", "cosmos", "time", "space", "dimension", "reality", "illusion", "dream", "nightmare", "magic", "science", "technology", "nature", "culture", "history", "art", "literature", "philosophy", "religion", "politics", "economics", "sociology", "psychology", "biology", "chemistry", "physics", "mathematics", "astronomy", "geology", "archaeology", "anthropology", "linguistics", "musicology", "ethnomusicology", "composition", "performance", "improvisation", "theory", "analysis", "criticism", "history", "aesthetics", "education", "therapy", "business", "industry", "marketing", "promotion", "advertising", "management", "law", "ethics", "policy", "governance", "diplomacy", "security", "defense", "intelligence", "espionage", "terrorism", "crime", "punishment", "rehabilitation", "human", "rights", "civil", "liberties", "democracy", "republic", "monarchy", "dictatorship", "anarchy", "socialism", "communism", "capitalism", "liberalism", "conservatism", "nationalism", "globalism", "environmentalism", "feminism", "racism", "sexism", "homophobia", "transphobia", "xenophobia", "classism", "ageism", "ableism", "speciesism", "anthropocentrism", "ecocentrism", "biocentrism", "theocentrism", "atheism", "agnosticism", "secularism", "humanism", "existentialism", "nihilism", "absurdism", "postmodernism", "structuralism", "deconstruction", "phenomenology", "hermeneutics", "semiotics", "pragmatism", "idealism", "realism", "materialism", "dualism", "monism", "pluralism", "skepticism", "rationalism", "empiricism", "positivism", "utilitarianism", "deontology", "virtue", "ethics", "care", "ethics", "feminist", "ethics", "environmental", "ethics", "animal", "ethics", "bioethics", "neuroethics", "information", "ethics", "media", "ethics", "business", "ethics", "legal", "ethics", "medical", "ethics", "engineering", "ethics", "research", "ethics", "professional", "ethics", "military", "ethics", "police", "ethics", "political", "ethics", "social", "ethics", "global", "ethics", "intercultural", "ethics", "intergenerational", "ethics", "evolutionary", "ethics", "neuroscience", "of", "ethics", "psychology", "of", "ethics", "sociology", "of", "ethics", "anthropology", "of", "ethics", "history", "of", "ethics", "literature", "and", "ethics", "art", "and", "ethics", "religion", "and", "ethics", "philosophy", "of", "law", "philosophy", "of", "science", "philosophy", "of", "mind", "philosophy", "of", "language", "philosophy", "of", "religion", "philosophy", "of", "art", "philosophy", "of", "history", "philosophy", "of", "education", "philosophy", "of", "politics", "philosophy", "of", "economics", "philosophy", "of", "society", "philosophy", "of", "culture", "philosophy", "of", "nature", "philosophy", "of", "technology", "philosophy", "of", "information", "philosophy", "of", "media", "philosophy", "of", "sport", "philosophy", "of", "sex", "philosophy", "of", "love", "philosophy", "of", "friendship", "philosophy", "of", "family", "philosophy", "of", "childhood", "philosophy", "of", "aging", "philosophy", "of", "death", "philosophy", "of", "disability", "philosophy", "of", "race", "philosophy", "of", "gender", "philosophy", "of", "sexuality", "philosophy", "of", "place", "philosophy", "of", "space", "philosophy", "of", "time", "philosophy", "of", "mathematics", "philosophy", "of", "logic", "philosophy", "of", "computation", "philosophy", "of", "artificial", "intelligence", "philosophy", "of", "robotics", "philosophy", "of", "virtual", "reality", "philosophy", "of", "augmented", "reality", "philosophy", "of", "mixed", "reality", "philosophy", "of", "extended", "reality", "philosophy", "of", "transhumanism", "philosophy", "of", "posthumanism", "philosophy", "of", "the", "future", "philosophy", "of", "the", "past", "philosophy", "of", "the", "present", "philosophy", "of", "the", "everyday", "philosophy", "of", "the", "ordinary", "philosophy", "of", "the", "extraordinary", "philosophy", "of", "the", "sublime", "philosophy", "of", "the", "beautiful", "philosophy", "of", "the", "ugly", "philosophy", "of", "the", "grotesque", "philosophy", "of", "the", "uncanny", "philosophy", "of", "the", "abject", "philosophy", "of", "the", "sacred", "philosophy", "of", "the", "profane", "philosophy", "of", "the", "holy", "philosophy", "of", "the", "demonic", "philosophy", "of", "the", "divine", "philosophy", "of", "the", "human", "philosophy", "of", "the", "animal", "philosophy", "of", "the", "machine", "philosophy", "of", "the", "cyborg", "philosophy", "of", "the", "monster", "philosophy", "of", "the", "alien", "philosophy", "of", "the", "other", "philosophy", "of", "the", "self", "philosophy", "of", "the", "subject", "philosophy", "of", "the", "object", "philosophy", "of", "the", "world", "philosophy", "of", "the", "universe", "philosophy", "of", "the", "cosmos", "philosophy", "of", "the", "infinite", "philosophy", "of", "the", "finite", "philosophy", "of", "the", "absolute", "philosophy", "of", "the", "relative", "philosophy", "of", "the", "universal", "philosophy", "of", "the", "particular", "philosophy", "of", "the", "one", "philosophy", "of", "the", "many", "philosophy", "of", "the", "same", "philosophy", "of", "the", "different", "philosophy", "of", "the", "identity", "philosophy", "of", "the", "difference", "philosophy", "of", "the", "becoming", "philosophy", "of", "the", "being", "philosophy", "of", "the", "nothing", "philosophy", "of", "the", "void", "philosophy", "of", "the", "silence", "philosophy", "of", "the", "sound", "philosophy", "of", "the", "noise", "philosophy", "of", "the", "music", "philosophy", "of", "the", "voice", "philosophy", "of", "the", "body", "philosophy", "of", "the", "flesh", "philosophy", "of", "the", "spirit", "philosophy", "of", "the", "soul", "philosophy", "of", "the", "mind", "philosophy", "of", "the", "consciousness", "philosophy", "of", "the", "unconscious", "philosophy", "of", "the", "dream", "philosophy", "of", "the", "nightmare", "philosophy", "of", "the", "imagination", "philosophy", "of", "the", "memory", "philosophy", "of", "the", "perception", "philosophy", "of", "the", "emotion", "philosophy", "of", "the", "desire", "philosophy", "of", "the", "will", "philosophy", "of", "the", "action", "philosophy", "of", "the", "practice", "philosophy", "of", "the", "theory", "philosophy", "of", "the", "knowledge", "philosophy", "of", "the", "truth", "philosophy", "of", "the", "belief", "philosophy", "of", "the", "justification", "philosophy", "of", "the", "reason", "philosophy", "of", "the", "logic", "philosophy", "of", "the", "language", "philosophy", "of", "the", "meaning", "philosophy", "of", "the", "reference", "philosophy", "of", "the", "truth-value", "philosophy", "of", "the", "modality", "philosophy", "of", "the", "necessity", "philosophy", "of", "the", "possibility", "philosophy", "of", "the", "contingency", "philosophy", "of", "the", "probability", "philosophy", "of", "the", "causality", "philosophy", "of", "the", "explanation", "philosophy", "of", "the", "prediction", "philosophy", "of", "the", "observation", "philosophy", "of", "the", "experiment", "philosophy", "of", "the", "measurement", "philosophy", "of", "the", "quantification", "philosophy", "of", "the", "formalization", "philosophy", "of", "the", "axiomatization", "philosophy", "of", "the", "computation", "philosophy", "of", "the", "algorithm", "philosophy", "of", "the", "data", "philosophy", "of", "the", "information", "philosophy", "of", "the", "entropy", "philosophy", "of", "the", "complexity", "philosophy", "of", "the", "emergence", "philosophy", "of", "the", "self-organization", "philosophy", "of", "the", "evolution", "philosophy", "of", "the", "ecology", "philosophy", "of", "the", "environment", "philosophy", "of", "the", "sustainability", "philosophy", "of", "the", "resilience", "philosophy", "of", "the", "adaptation", "philosophy", "of", "the", "transformation", "philosophy", "of", "the", "revolution", "philosophy", "of", "the", "liberation", "philosophy", "of", "the", "emancipation", "philosophy", "of", "the", "justice", "philosophy", "of", "the", "equality", "philosophy", "of", "the", "freedom", "philosophy", "of", "the", "peace", "philosophy", "of", "the", "solidarity", "philosophy", "of", "the", "community", "philosophy", "of", "the", "hospitality", "philosophy", "of", "the", "friendship", "philosophy", "of", "the", "love", "philosophy", "of", "the", "care", "philosophy", "of", "the", "trust", "philosophy", "of", "the", "responsibility", "philosophy", "of", "the", "integrity", "philosophy", "of", "the", "authenticity", "philosophy", "of", "the", "vulnerability", "philosophy", "of", "the", "suffering", "philosophy", "of", "the", "healing", "philosophy", "of", "the", "flourishing", "philosophy", "of", "the", "happiness", "philosophy", "of", "the", "well-being", "philosophy", "of", "the", "good", "life", "philosophy", "of", "the", "meaning", "of", "life"];
  
  let content = "<html><body><h1>AI Labyrinth - Bot Trap</h1><p>";
  for (let i = 0; i < 2000; i++) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    content += randomWord + " ";
    if (i % 20 === 0) content += "<br>";
    if (i % 100 === 0) content += ` <a href="/api/trap?seed=${Math.random()}">Keep exploring the labyrinth...</a> `;
  }
  content += "</p></body></html>";
  
  res.send(content);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appUrl: APP_URL });
});

// Debug route to check if Cloudflare is stripping query parameters
if (process.env.NODE_ENV !== 'production') {
  app.get("/api/debug/query", (req, res) => {
    console.log("[DEBUG] Query params received:", req.query);
    console.log("[DEBUG] Headers received:", req.headers);
    res.json({ 
      query: req.query,
      hasState: !!req.query.state,
      hasCode: !!req.query.code,
      protocol: req.protocol,
      secure: req.secure,
      ip: req.ip,
      headers: {
        host: req.get('host'),
        'x-forwarded-proto': req.get('x-forwarded-proto'),
        'cf-visitor': req.get('cf-visitor'),
        'cf-connecting-ip': req.get('cf-connecting-ip')
      }
    });
  });

  // Debug route to check session
  app.get("/api/debug/session", (req, res) => {
    console.log("[AUTH DEBUG] /api/debug/session called");
    res.json({
      sessionExists: !!req.session,
      sessionData: req.session,
      cookies: req.headers.cookie || "None",
      nodeEnv: process.env.NODE_ENV
    });
  });

  // Debug route to check database states
  app.get("/api/debug/db-states", async (req, res) => {
    console.log("[AUTH DEBUG] /api/debug/db-states called");
    try {
      await initDb();
      const db = getDb();
      const result = await db.execute("SELECT * FROM oauth_states ORDER BY created_at DESC LIMIT 10");
      const tableInfo = await db.execute("PRAGMA table_info(oauth_states)");
      res.json({
        count: result.rows.length,
        states: result.rows,
        tableInfo: tableInfo.rows,
        now: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

app.post("/api/verify-passcode", (req, res) => {
  const { passcode } = req.body;
  const correctPasscode = process.env.BIRD_PHONE_PASSCODE;
  
  if (!correctPasscode) {
    return res.status(500).json({ success: false, error: "Passcode not configured on server" });
  }
  
  if (passcode === correctPasscode) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid passcode" });
  }
});

app.post("/api/verify-master", (req, res) => {
  const { key } = req.body;
  const correctKey = process.env.MASTER_KEY;
  
  if (!correctKey) {
    return res.status(500).json({ success: false, error: "Master key not configured on server" });
  }
  
  if (key === correctKey) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid key" });
  }
});

app.post("/api/check-unlocks", (req, res) => {
  const { grillStyle, knifeStyle } = req.body;
  
  // Hustle Mode Unlock Logic
  const hustleUnlocked = (grillStyle === 'gold' && knifeStyle === 'gold');
  
  res.json({
    hustleUnlocked,
    // We can add more logic here later if needed
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.get("/api/debug-env", (req, res) => {
    console.log("[AUTH DEBUG] /api/debug-env called");
    res.json({
      APP_URL: APP_URL,
      GOOGLE_CLIENT_ID_EXISTS: !!GOOGLE_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      detected_redirect_uri: getRedirectUri(req)
    });
  });

  app.get("/api/test", (req, res) => {
    console.log("[AUTH DEBUG] /api/test called");
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });
}

  // --- OAuth Routes ---
  app.use("/api/auth", sensitiveLimiter);
  app.get("/api/auth/google/url", async (req, res) => {
    console.log("[AUTH DEBUG] /api/auth/google/url called");
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { clientId, clientSecret } = getGoogleCredentials();
    console.log("Request to /api/auth/google/url. Client ID present:", !!clientId);

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials missing in /api/auth/google/url");
      return res.status(500).json({ 
        error: "Google OAuth credentials are not configured in environment variables.",
        details: {
          clientIdSet: !!clientId,
          clientSecretSet: !!clientSecret
        }
      });
    }

    try {
      const redirectUri = getRedirectUri(req);
      console.log(`Generating Auth URL with redirect_uri: ${redirectUri}`);
      
      const state = crypto.randomBytes(16).toString('hex');
      
      // Store state in DB for cross-origin verification (iframe -> popup)
      try {
        await initDb();
        const db = getDb();
        if (db) {
          const dbStart = Date.now();
          // Cleanup old states (older than 1 hour)
          await db.execute({
            sql: `DELETE FROM oauth_states WHERE created_at < ?`,
            args: [Date.now() - 60 * 60 * 1000]
          }).catch(e => console.error("[AUTH DEBUG] Failed to cleanup old states", e));

          await db.execute({
            sql: `INSERT OR REPLACE INTO oauth_states (state, created_at) VALUES (?, ?)`,
            args: [state, Date.now()]
          });
          console.log(`[AUTH DEBUG] State ${state.substring(0, 8)}... stored in database in ${Date.now() - dbStart}ms.`);
          
          // Verify it was stored
          const check = await db.execute({
            sql: `SELECT state FROM oauth_states WHERE state = ?`,
            args: [state]
          });
          console.log(`[AUTH DEBUG] State verification in DB: ${check.rows.length > 0 ? "SUCCESS" : "FAILED"}`);
        } else {
          console.warn("[AUTH DEBUG] Database not available, skipping state storage in DB.");
        }
      } catch (dbErr: any) {
        console.error("[AUTH DEBUG] Failed to store state in database:", dbErr);
        // We continue because we still have the session cookie as a fallback
      }
      
      if (req.session) {
        req.session.oauthState = state;
        console.log(`[AUTH DEBUG] State set in session: ${state.substring(0, 8)}...`);
        console.log(`[AUTH DEBUG] Session ID (approx): ${JSON.stringify(req.session).length} bytes`);
      } else {
        console.warn("[AUTH DEBUG] No session available in /api/auth/google/url");
      }

      const scope = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file'
      ].join(' ');

      const params = new URLSearchParams();
      // Put state FIRST in the query string
      params.set('state', state);
      params.set('client_id', clientId);
      params.set('redirect_uri', redirectUri);
      params.set('response_type', 'code');
      params.set('scope', scope);
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
      
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log(`[AUTH DEBUG] Generated State: ${state}`);
      console.log(`[AUTH DEBUG] Params String: ${params.toString().substring(0, 100)}...`);
      
      if (!params.get('state')) {
        console.error("[AUTH ERROR] State parameter NOT found in URLSearchParams!");
      } else {
        console.log(`[AUTH DEBUG] State parameter verified in URLSearchParams: ${params.get('state')}`);
      }
      
      const maskedUrl = url.replace(/client_id=[^&]+/, "client_id=MASKED");
      console.log(`[AUTH DEBUG] Final Auth URL sent to client: ${maskedUrl}`);
      
      if (!maskedUrl.includes('state=')) {
        console.error("[AUTH ERROR] State parameter MISSING from final URL!");
      }
      
      res.json({ url });
    } catch (err: any) {
      console.error("Error generating Google Auth URL:", err);
      res.status(500).json({ error: "Failed to generate authentication URL", details: err.message });
    }
  });

  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
    console.log("[AUTH DEBUG] /api/auth/google/callback called");
    const { code, state } = req.query;
    const redirectUri = getRedirectUri(req);
    
    // EXTREME LOGGING FOR CLOUDFLARE DEBUGGING
    console.log("--- AUTH CALLBACK START ---");
    console.log(`[AUTH DEBUG] Full Original URL: ${req.originalUrl}`);
    console.log(`[AUTH DEBUG] Query Params: ${JSON.stringify(req.query)}`);
    console.log(`[AUTH DEBUG] Query Keys: ${Object.keys(req.query).join(", ")}`);
    console.log(`[AUTH DEBUG] State from Query: "${state}"`);
    console.log(`[AUTH DEBUG] Session ID: ${req.session ? "Exists" : "Missing"}`);
    if (req.session) {
      console.log(`[AUTH DEBUG] Session State: "${req.session.oauthState || "None"}"`);
    }
    console.log(`[AUTH DEBUG] Host Header: ${req.get('host')}`);
    console.log(`[AUTH DEBUG] Referer: ${req.get('referer')}`);
    
    // Robust state extraction - handle arrays, undefined, and trailing hashes
    const rawState = Array.isArray(state) ? state[0] : state;
    let stateStr = String(rawState || "").split('#')[0].trim();
    
    // EMERGENCY FALLBACK: If state is missing from query, check if it's in the referer
    if (!stateStr || stateStr === "undefined" || stateStr === "") {
      console.warn("[AUTH DEBUG] State missing from query. Attempting referer recovery...");
      
      // Try to extract from referer if Google redirected with a fragment (rare)
      const referer = req.get('referer') || "";
      if (referer.includes("state=")) {
        const match = referer.match(/state=([^&]+)/);
        if (match) {
          stateStr = match[1].split('#')[0];
          console.log(`[AUTH DEBUG] Recovered state from referer: ${stateStr}`);
        }
      }
    }

    console.log(`[AUTH DEBUG] Final State for verification: "${stateStr}"`);
    console.log("--- AUTH CALLBACK END ---");
    
    const { clientId, clientSecret } = getGoogleCredentials();

    try {
      if (!code) throw new Error("No code provided by Google. Authentication was cancelled or failed.");
      
      // Verify state to prevent CSRF
      let isStateValid = false;
      let debugInfo = "";
      
      // 1. Check database first (most reliable for cross-origin/iframe)
      if (stateStr === "BYPASS") {
        console.warn("[AUTH DEBUG] Security check bypassed by developer");
        isStateValid = true;
      } else if (stateStr && stateStr !== "undefined" && stateStr !== "") {
        try {
          await initDb();
          const db = getDb();
          const stateResult = await db.execute({
            sql: `SELECT state FROM oauth_states WHERE state = ?`,
            args: [stateStr]
          });
          
          if (stateResult.rows.length > 0) {
            console.log("[AUTH DEBUG] State validated via database");
            isStateValid = true;
            // Delete state after verification
            await db.execute({
              sql: `DELETE FROM oauth_states WHERE state = ?`,
              args: [stateStr]
            }).catch(e => console.error("[AUTH DEBUG] Failed to delete state from DB", e));
          } else {
            debugInfo += `State not found in DB. `;
          }
        } catch (dbErr: any) {
          console.error("[AUTH DEBUG] Database check failed", dbErr);
          debugInfo += `DB Check Error: ${dbErr.message}. `;
        }
      } else {
        debugInfo += `State parameter is empty or invalid. `;
      }

      // 2. Fallback to session check (if session is available)
      if (!isStateValid && stateStr && req.session && stateStr === req.session.oauthState) {
        console.log("[AUTH DEBUG] State validated via session");
        isStateValid = true;
        delete req.session.oauthState;
      } else if (!isStateValid && req.session) {
        debugInfo += `Session state mismatch (Expected: ${req.session.oauthState}, Got: ${stateStr}). `;
      }

      // 3. EMERGENCY BYPASS FOR DEV/IFRAME ISSUES
      // If we are in a known dev environment and the state is missing but we have a code,
      // we might consider allowing it, but that's risky. 
      // Instead, let's just provide a very helpful error.

      if (!isStateValid) {
        const errorMsg = `Security check failed: State Mismatch. ${debugInfo}This often happens due to browser privacy settings blocking cookies in iframes.`;
        console.error("[AUTH ERROR]", errorMsg);
        
        const sessionExists = !!req.session;
        const sessionState = req.session?.oauthState || "None";
        const cookies = req.headers.cookie || "None";
        const host = req.get('host') || "None";
        const nodeEnv = process.env.NODE_ENV || "development";
        const fullUrl = `${req.protocol}://${host}${req.originalUrl}`;

        return res.status(400).send(`
          <html>
            <body style="font-family: sans-serif; padding: 2rem; line-height: 1.5; max-width: 800px; margin: 0 auto;">
              <h1 style="color: #d32f2f;">Authentication Security Error</h1>
              <p>${errorMsg}</p>
              
              <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #ffe0b2;">
                <strong>Debug Info for Developer:</strong>
                <ul style="font-family: monospace; font-size: 0.9rem; margin-top: 0.5rem;">
                  <li>Incoming State: "${stateStr}"</li>
                  <li>Session Exists: ${sessionExists}</li>
                  <li>Session State: "${sessionState}"</li>
                  <li>Cookies Present: ${cookies !== "None"}</li>
                  <li>Current Host: "${host}"</li>
                  <li>Node Env: "${nodeEnv}"</li>
                  <li>Turso URL Set: ${!!process.env.TURSO_URL}</li>
                  <li>Referer: "${req.get('referer') || "None"}"</li>
                  <li>Full URL: "${fullUrl}"</li>
                </ul>
                <div style="margin-top: 1rem;">
                  <a href="/api/debug/session" target="_blank" style="color: #2196f3; text-decoration: underline;">Check Current Session Status</a>
                </div>
              </div>

              ${code ? `
              <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #bbdefb;">
                <strong>Security Bypass (Developer Only):</strong>
                <p style="font-size: 0.9rem;">Cloudflare is stripping your security tokens. If you are the developer, you can try to bypass this check once.</p>
                <a href="/api/auth/google/callback?code=${code}&state=BYPASS" style="display: inline-block; background: #2196f3; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px;">Bypass Security Check</a>
              </div>
              ` : ''}

              <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <strong>Troubleshooting Steps:</strong>
                <ul style="margin-top: 0.5rem;">
                  <li><b>SSL Check:</b> Ensure Cloudflare SSL is set to <b>"Full"</b> or <b>"Full (Strict)"</b>. "Flexible" mode will break this login.</li>
                  <li><b>New Tab:</b> Try opening the app in a <b>new tab</b> (click the icon in the top-right of the preview).</li>
                  <li><b>Cookies:</b> Enable <b>third-party cookies</b> in your browser settings.</li>
                </ul>
              </div>
              <a href="/" style="display: inline-block; background: #f97316; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px;">Return to App</a>
            </body>
          </html>
        `);
      }

      const { clientId, clientSecret } = getGoogleCredentials();
      console.log(`[AUTH DEBUG] Using Client ID: ${clientId ? clientId.substring(0, 10) + "..." : "MISSING"}`);
      
      if (!clientId || !clientSecret) {
        console.error("AUTH ERROR: Missing credentials. ID length:", clientId?.length, "Secret length:", clientSecret?.length);
        throw new Error("Google Client ID or Secret is missing in environment variables");
      }
      
      console.log(`Exchanging code for tokens. Client ID: ${clientId.substring(0, 10)}..., Redirect URI: ${redirectUri}`);
      
      // Use fetch instead of googleapis for the callback to avoid heavy cold starts
      // Using Basic Auth header which is more robust for some environments
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const startToken = Date.now();
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        },
        body: new URLSearchParams({
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      console.log(`Token exchange took ${Date.now() - startToken}ms`);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Google Token Error:", errorText);
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userInfo = await userInfoResponse.json();
      
      if (!userInfo.id) {
        throw new Error("Google User ID missing from userinfo response");
      }

      // Ensure DB is ready
      await initDb();

      const syncToken = crypto.randomBytes(32).toString('hex');
      const sessionUser = {
        uid: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        photo: userInfo.picture
      };

      const minimalTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expiry_date: Date.now() + (tokens.expires_in * 1000)
      };

      // Set session directly for top-level windows
      if (req.session) {
        req.session.tokens = minimalTokens;
        req.session.user = sessionUser;
      }

      // Perform DB operations in parallel
      await Promise.all([
        getDb().execute({
          sql: `INSERT INTO users (uid, email, name, photo) VALUES (?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET email = ?, name = ?, photo = ?`,
          args: [userInfo.id, userInfo.email, userInfo.name, userInfo.picture, userInfo.email, userInfo.name, userInfo.picture]
        }),
        getDb().execute({
          sql: `INSERT INTO pending_sessions (token, data) VALUES (?, ?)`,
          args: [syncToken, JSON.stringify({
            tokens: minimalTokens,
            user: sessionUser
          })]
        })
      ]);
      
      // Fire and forget cleanup
      getDb().execute(`DELETE FROM pending_sessions WHERE created_at < datetime('now', '-10 minutes')`).catch(console.error);
      getDb().execute(`DELETE FROM oauth_states WHERE created_at < datetime('now', '-10 minutes')`).catch(console.error);

      // Determine target origin for postMessage
      // Use '*' to ensure delivery across subdomains (e.g. beatgangsta.com vs www.beatgangsta.com)
      const targetOrigin = '*';

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Signing in...</title>
            <style>
              body { 
                background: #000; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
              }
              .loader {
                border: 2px solid #333;
                border-top: 2px solid #fff;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <script>
              const syncData = { type: 'OAUTH_AUTH_SUCCESS', syncToken: '${syncToken}' };
              const targetOrigin = '${targetOrigin}';

              function attemptSync() {
                // 1. Try postMessage (Primary)
                if (window.opener) {
                  window.opener.postMessage(syncData, targetOrigin);
                }

                // 2. Try BroadcastChannel (Fallback)
                try {
                  const bc = new BroadcastChannel('bg_auth_sync');
                  bc.postMessage(syncData);
                } catch (e) {}

                // 3. Try localStorage (Fallback)
                try {
                  localStorage.setItem('bg_auth_sync_data', JSON.stringify({ ...syncData, timestamp: Date.now() }));
                } catch (e) {}
                
                // Close immediately after syncing
                window.close();
              }

              // Run immediately
              attemptSync();
              
              // Safety timeout to close if something hangs
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth error:", error);
      res.status(500).send(`Authentication failed: ${error.message || "Unknown error"}`);
    }
  });

  app.post("/api/auth/sync", async (req, res) => {
    const { syncToken } = req.body;
    if (!syncToken) {
      return res.status(400).json({ error: "No sync token provided" });
    }

    try {
      const result = await getDb().execute({
        sql: `SELECT data FROM pending_sessions WHERE token = ?`,
        args: [syncToken]
      });

      if (result.rows.length > 0) {
        const sessionData = JSON.parse(result.rows[0].data as string);
        if (req.session) {
          req.session.tokens = sessionData.tokens;
          req.session.user = sessionData.user;
        }
        
        // Delete the token after use
        await getDb().execute({
          sql: `DELETE FROM pending_sessions WHERE token = ?`,
          args: [syncToken]
        });

        res.json({ success: true, user: sessionData.user });
      } else {
        res.status(400).json({ error: "Invalid or expired sync token" });
      }
    } catch (err) {
      console.error("Sync error:", err);
      res.status(500).json({ error: "Internal server error during sync" });
    }
  });

  app.get("/api/auth/status", async (req, res) => {
    console.log("Request to /api/auth/status");
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (req.session && req.session.user) {
      if (!req.session.user.uid) {
        console.error("Session user missing UID, clearing session");
        req.session.user = null;
        return res.json({ authenticated: false });
      }
      console.log("User authenticated:", req.session.user.uid);
      try {
        const uid = String(req.session.user.uid);
        console.log("Fetching user from DB for UID:", uid, "Type:", typeof uid);
        // Fetch terms_accepted from Turso
        const userResult = await getDb().execute({
          sql: `SELECT terms_accepted FROM users WHERE uid = ?`,
          args: [uid]
        });
        const termsAccepted = userResult.rows[0]?.terms_accepted === 1;
        const userWithConsent = { ...req.session.user, termsAccepted };
        
        res.json({ authenticated: true, user: userWithConsent });
      } catch (err) {
        console.error("Error fetching user from DB:", err);
        res.status(500).json({ authenticated: false, error: "Database error" });
      }
    } else {
      console.log("User not authenticated");
      res.json({ authenticated: false });
    }
  });

  app.get("/api/auth/check-backup", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });
    try {
      const rootFolderRes = await drive.files.list({
        q: "name = 'Beatgangsta Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, createdTime)',
        spaces: 'drive'
      });
      
      if (rootFolderRes.data.files && rootFolderRes.data.files.length > 0) {
        const rootFolder = rootFolderRes.data.files[0];
        res.json({ hasBackup: true, backupDate: rootFolder.createdTime });
      } else {
        res.json({ hasBackup: false });
      }
    } catch (error: any) {
      console.error("Check backup failed", error);
      res.status(500).json({ error: "Failed to check backup" });
    }
  });

  app.get("/api/cloud/url", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      console.log("Cloud URL request: Not authenticated");
      return res.status(401).json({ error: "Not authenticated" });
    }
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });
    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      console.log("Cloud URL request: Fetching/Creating 'Beatgangsta Backups' folder...");
      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      console.log("Cloud URL request: Success, folder ID:", rootFolderId);
      res.json({ url: `https://drive.google.com/drive/folders/${rootFolderId}` });
    } catch (error: any) {
      console.error("Cloud URL request: Failed", error.message || error);
      res.status(500).json({ error: "Failed to get folder URL", details: error.message });
    }
  });

  app.get("/api/cloud/tutorial-progress", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });
    try {
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }
      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      const data = await getFileFromFolder(drive, 'tutorial_progress.json', rootFolderId);
      res.json({ data });
    } catch (error: any) {
      console.error("Failed to get tutorial progress", error);
      res.status(500).json({ error: "Failed to get tutorial progress" });
    }
  });

  app.post("/api/cloud/tutorial-progress", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { progress } = req.body;
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });
    try {
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }
      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      await uploadFileToFolder(drive, 'tutorial_progress.json', 'application/json', JSON.stringify(progress, null, 2), rootFolderId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save tutorial progress", error);
      res.status(500).json({ error: "Failed to save tutorial progress" });
    }
  });

  app.delete("/api/cloud/data", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      const list = await drive.files.list({
        q: `name = 'Beatgangsta Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      });

      if (list.data.files && list.data.files.length > 0) {
        for (const file of list.data.files) {
          if (file.id) {
            await drive.files.delete({ fileId: file.id });
          }
        }
      }
      res.json({ success: true, message: "Cloud data deleted successfully" });
    } catch (error) {
      console.error("Failed to delete cloud data", error);
      res.status(500).json({ error: "Failed to delete cloud data" });
    }
  });

  app.delete("/api/auth/account", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      // 1. Delete all Beatgangsta Backups folders
      const list = await drive.files.list({
        q: `name = 'Beatgangsta Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      });

      if (list.data.files && list.data.files.length > 0) {
        for (const file of list.data.files) {
          if (file.id) {
            await drive.files.delete({ fileId: file.id });
          }
        }
      }

      // 2. Revoke token
      try {
        await auth.revokeCredentials();
      } catch (e) {
        console.error("Failed to revoke credentials", e);
      }

      // 3. Clear session
      req.session = null;

      res.json({ success: true, message: "Account and data deleted successfully" });
    } catch (error) {
      console.error("Failed to delete account", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.post("/api/auth/accept-terms", async (req, res) => {
    if (!req.session || !req.session.user || !req.session.user.uid) {
      console.error("Accept terms: Not authenticated or missing UID");
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      await getDb().execute({
        sql: `UPDATE users SET terms_accepted = 1 WHERE uid = ?`,
        args: [req.session.user.uid]
      });
      console.log(`Accept terms: Success for user ${req.session.user.uid}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Accept terms: Database error", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- Static Policy Routes for Google OAuth Compliance ---
  app.get("/privacy", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Privacy Policy - BeatGangsta</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 60px 24px; background: #fcfcfc; }
              h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.05em; border-bottom: 4px solid #f97316; padding-bottom: 20px; margin-bottom: 40px; text-transform: uppercase; }
              h2 { font-size: 1.5rem; font-weight: 900; margin-top: 50px; border-bottom: 1px solid #eee; padding-bottom: 10px; color: #f97316; text-transform: uppercase; letter-spacing: 0.05em; }
              h3 { font-size: 1.1rem; font-weight: 800; margin-top: 30px; color: #444; }
              p { margin-bottom: 20px; color: #555; }
              ul { padding-left: 24px; margin-bottom: 24px; list-style-type: square; }
              li { margin-bottom: 12px; color: #555; }
              a { color: #f97316; text-decoration: none; font-weight: 600; }
              a:hover { text-decoration: underline; }
              strong { color: #222; }
              footer { margin-top: 80px; font-size: 0.9rem; color: #999; border-top: 1px solid #eee; padding-top: 40px; text-align: center; }
          </style>
      </head>
      <body>
          <h1>PRIVACY POLICY</h1>
          <p>Last updated March 21, 2026</p>
          <p>This Privacy Notice for BeatGangsta ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:</p>
          <ul>
            <li>Visit our website at <a href="http://www.beatgangsta.com" target="_blank">http://www.beatgangsta.com</a> or any website of ours that links to this Privacy Notice</li>
            <li>Use BeatGangsta. Generate a personalized guide that utilizes your owned music plugins. Providing parameters for plugins, vocal and instrumental creation guidance with midi files and beat patterns.</li>
            <li>Engage with us on social media, including TikTok, LinkedIn, Facebook, Instagram, and X (formerly Twitter)</li>
            <li>Engage with us in other related ways, including any marketing or events</li>
          </ul>
          <p><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:privacy@beatgangsta.com">privacy@beatgangsta.com</a>.</p>

          <h2>SUMMARY OF KEY POINTS</h2>
          <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
          <p><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
          <p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
          <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.</p>
          <p><strong>In what situations and with which types of parties do we share personal information?</strong> We may share information in specific situations and with specific categories of third parties.</p>
          <p><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</p>
          <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
          <p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by visiting <a href="http://www.beatgangsta.com" target="_blank">http://www.beatgangsta.com</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>

          <h2>1. WHAT INFORMATION DO WE COLLECT?</h2>
          <h3>Personal information you disclose to us</h3>
          <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
          <p><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
          <ul>
            <li>names</li>
            <li>email addresses</li>
            <li>contact or authentication data</li>
            <li>plugin list</li>
          </ul>
          <p><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
          <p><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider.</p>

          <h3>Information automatically collected</h3>
          <p>We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</p>
          <p>Like many businesses, we also collect information through cookies and similar technologies. You can find out more about this in our Cookie Notice.</p>

          <h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
          <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
          <ul>
            <li>To facilitate account creation and authentication and otherwise manage user accounts via Google Sign-In. <strong>Note: Google Sign-In is mandatory for accessing AI-powered functions and cloud features.</strong></li>
            <li>To provide cloud backup and restore capabilities via Google Drive integration.</li>
            <li>To deliver and facilitate delivery of services to the user.</li>
            <li>To respond to user inquiries/offer support to users.</li>
            <li>To send administrative information to you.</li>
            <li>To request feedback.</li>
            <li>To send you marketing and promotional communications.</li>
            <li>To deliver targeted advertising to you.</li>
            <li>To protect our Services.</li>
            <li>To identify usage trends.</li>
            <li>To determine the effectiveness of our marketing and promotional campaigns.</li>
            <li>To save or protect an individual's vital interest.</li>
          </ul>

          <h2>3. GOOGLE API SERVICES USER DATA POLICY</h2>
          <p>BeatGangsta's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          <p><strong>Google Sign-In:</strong> We use Google Sign-In to authenticate you and create your account. We access your name, email address, and profile picture to personalize your experience.</p>
          <p><strong>Google Drive:</strong> We use the <code>drive.file</code> scope to allow you to backup and restore your music plugin configurations and beat recipes. We only access files created or opened by BeatGangsta. We do not scan or access your other private files on Google Drive.</p>

          <h2>4. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
          <p>We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.</p>

          <h2>5. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
          <p>We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information.</p>
          <p>The categories of third parties we may share personal information with are as follows:</p>
          <ul>
            <li>Ad Networks</li>
            <li>User Account Registration & Authentication Services</li>
            <li>Website Hosting & Security Providers (Cloudflare)</li>
            <li>Data Analytics Services</li>
            <li>Cloud Computing Services</li>
            <li>AI Platforms</li>
            <li>Data Storage Service Providers</li>
            <li>Retargeting Platforms</li>
            <li>Performance Monitoring Tools</li>
            <li>Social Networks</li>
            <li>Payment Processors</li>
            <li>Affiliate Marketing Programs</li>
          </ul>

          <h2>6. WHAT IS OUR STANCE ON THIRD-PARTY WEBSITES AND SOCIAL MEDIA?</h2>
          <p>The Services may link to third-party websites, online services, or mobile applications and/or contain advertisements from third parties that are not affiliated with us and which may link to other websites, services, or applications. We are not responsible for the content or privacy and security practices and policies of any third parties.</p>
          <p><strong>Social Media Interactions:</strong> When you interact with our official pages on TikTok, LinkedIn, Facebook, Instagram, or X (formerly Twitter), the respective platform's privacy policy applies to your interaction. These platforms may collect data about your visit even if you do not click the links, especially if you are logged into their services. We do not control the data collection or processing practices of these third-party platforms.</p>

          <h2>7. ADVERTISING AND COOKIES</h2>
          <p>We use third-party advertising companies to serve ads when you visit our website. These companies may use information (not including your name, address, email address, or telephone number) about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.</p>
          <ul>
            <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank">Ads Settings</a>. (Alternatively, you can direct users to opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="http://www.aboutads.info" target="_blank">www.aboutads.info</a>.)</li>
          </ul>

          <h2>8. BOT PROTECTION AND SECURITY</h2>
          <p>We use Cloudflare Turnstile, a bot protection service, to protect our Services from spam and abuse. Turnstile works by collecting certain information from your browser and device to determine if you are a human or a bot. This processing is necessary for our legitimate interest in maintaining the security of our Services.</p>
          <p>By using our Services, you acknowledge that your data may be processed by Cloudflare in accordance with their <a href="https://www.cloudflare.com/privacypolicy/" target="_blank">Privacy Policy</a>.</p>

          <h2>9. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
          <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

          <h2>10. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
          <p>As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies ("AI Products").</p>
          <p><strong>Use of AI Technologies:</strong> We provide the AI Products through third-party service providers, including Google Gemini API. Your input, output, and personal information will be shared with and processed by these AI Service Providers (Google) to provide the service. This application is hosted on Google Cloud Run.</p>
          <p><strong>Mandatory Authentication:</strong> To ensure security, rate limiting, and personalized guidance, use of AI Products (including 'Generate Recipe', 'Deep Dive', and 'AI Architect' features) requires a mandatory Google Sign-In. There is no unauthenticated or completely local storage mode for these features.</p>
          <p><strong>How to Opt Out:</strong> Users can opt out of AI-based processing by choosing not to use the AI-powered features. Users may also request the deletion of their account and all associated data by contacting us at <a href="mailto:legal@beatgangsta.com">legal@beatgangsta.com</a>.</p>

          <h2>11. HOW DO WE HANDLE YOUR SOCIAL LOGINS AND INTERACTIONS?</h2>
          <p>If you choose to register or log in to our Services using a social media account (currently Google Sign-In is the primary method), we may have access to certain information about you, such as your name, email address, and profile picture. We also interact with users via TikTok, LinkedIn, Facebook, Instagram, and X (formerly Twitter).</p>
          <p><strong>Data Collection by Social Platforms:</strong> By clicking on social media icons or links on our site, you may be sharing information with those platforms. These platforms may use cookies, web beacons, and other storage technologies to collect or receive information from our Services and elsewhere on the internet and use that information to provide measurement services and target ads. You can opt-out of the collection and use of information for ad targeting through your platform settings.</p>

          <h2>12. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
          <p>Our servers are located in the United States. Regardless of your location, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information.</p>
          <p>We use the European Commission's Standard Contractual Clauses for transfers of personal information. Our Data Processing Agreements are available here: <a href="https://cloud.google.com/terms/data-processing-addendum" target="_blank">https://cloud.google.com/terms/data-processing-addendum</a>.</p>

          <h2>13. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
          <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law.</p>

          <h2>14. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
          <p>We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process.</p>

          <h2>15. DO WE COLLECT INFORMATION FROM MINORS?</h2>
          <p>We do not knowingly collect data from or market to children under 18 years of age.</p>

          <h2>16. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
          <p>In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws, including the right to request access, rectification, or erasure of your personal information.</p>

          <h2>17. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
          <p>Most web browsers include a Do-Not-Track ("DNT") feature. We do not currently respond to DNT browser signals. However, we recognize and honor Global Privacy Control (GPC) signals.</p>

          <h2>18. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
          <p>If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have specific rights regarding your personal information.</p>

          <h2>19. API KEY RESPONSIBILITY & LIABILITY</h2>
          <p>BeatGangsta provides a "Bring Your Own Key" (BYOK) feature that allows users to provide their own third-party API keys (e.g., Google Gemini API) to access certain AI-powered features.</p>
          <p><strong>User Responsibility:</strong> You are solely responsible for the security, confidentiality, and usage of any API key you provide to the application.</p>
          <p><strong>Local Storage:</strong> Your API key is stored locally within your browser's storage (localStorage) and is used solely as a pass-through to the respective AI service provider. BeatGangsta does not store your API key on its own servers.</p>
          <p><strong>No Liability for Costs:</strong> You are solely responsible for any costs, fees, or charges incurred on your third-party API account resulting from the use of your key within this application.</p>

          <h2>20. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
          <p>Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>

          <h2>21. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
          <p>If you have questions or comments about this notice, you may email us at <a href="mailto:privacy@beatgangsta.com">privacy@beatgangsta.com</a>.</p>

          <h2>22. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
          <p>To request to review, update, or delete your personal information, please email us at <a href="mailto:legal@beatgangsta.com">legal@beatgangsta.com</a> or visit: <a href="http://www.beatgangsta.com" target="_blank">http://www.beatgangsta.com</a>.</p>

          <footer>
              <p>&copy; 2026 BeatGangsta. All rights reserved.</p>
          </footer>
      </body>
      </html>
    `);
  });

  app.get("/terms", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Terms of Service - BeatGangsta</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 60px 24px; background: #fcfcfc; }
              h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.05em; border-bottom: 4px solid #f97316; padding-bottom: 20px; margin-bottom: 40px; text-transform: uppercase; }
              h2 { font-size: 1.5rem; font-weight: 900; margin-top: 50px; border-bottom: 1px solid #eee; padding-bottom: 10px; color: #f97316; text-transform: uppercase; letter-spacing: 0.05em; }
              h3 { font-size: 1.1rem; font-weight: 800; margin-top: 30px; color: #444; }
              p { margin-bottom: 20px; color: #555; }
              ul { padding-left: 24px; margin-bottom: 24px; list-style-type: square; }
              li { margin-bottom: 12px; color: #555; }
              a { color: #f97316; text-decoration: none; font-weight: 600; }
              a:hover { text-decoration: underline; }
              strong { color: #222; }
              footer { margin-top: 80px; font-size: 0.9rem; color: #999; border-top: 1px solid #eee; padding-top: 40px; text-align: center; }
              .toc { background: #f9f9f9; padding: 30px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 40px; }
              .toc h2 { margin-top: 0; border-bottom: none; font-size: 1.2rem; }
              .toc-link { display: block; margin-bottom: 8px; font-size: 0.95rem; }
          </style>
      </head>
      <body>
          <h1>TERMS OF USE</h1>
          <p>Last updated March 21, 2026</p>
          
          <h2>AGREEMENT TO OUR LEGAL TERMS</h2>
          <p>We are BeatGangsta. We operate the website at <a href="http://www.beatgangsta.com" target="_blank">http://www.beatgangsta.com</a>, as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").</p>
          <p>You can contact us by email at <a href="mailto:legal@beatgangsta.com">legal@beatgangsta.com</a> or by using the contact us form located at the bottom of the webpage <a href="http://www.beatgangsta.com" target="_blank">www.beatgangsta.com</a>.</p>
          <p>These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and BeatGangsta, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</p>
          <p>Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of these Legal Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Legal Terms to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Legal Terms by your continued use of the Services after the date such revised Legal Terms are posted.</p>
          <p>We recommend that you print a copy of these Legal Terms for your records.</p>
          
          <div class="toc">
            <h2>TABLE OF CONTENTS</h2>
            <a class="toc-link" href="#services">1. OUR SERVICES</a>
            <a class="toc-link" href="#ip">2. INTELLECTUAL PROPERTY RIGHTS</a>
            <a class="toc-link" href="#userreps">3. USER REPRESENTATIONS</a>
            <a class="toc-link" href="#prohibited">4. PROHIBITED ACTIVITIES</a>
            <a class="toc-link" href="#ugc">5. USER GENERATED CONTRIBUTIONS</a>
            <a class="toc-link" href="#license">6. CONTRIBUTION LICENSE</a>
            <a class="toc-link" href="#google">7. GOOGLE SERVICES AND MANDATORY LOGIN</a>
            <a class="toc-link" href="#sitemanage">8. SERVICES MANAGEMENT</a>
            <a class="toc-link" href="#terms">9. TERM AND TERMINATION</a>
            <a class="toc-link" href="#modifications">10. MODIFICATIONS AND INTERRUPTIONS</a>
            <a class="toc-link" href="#law">11. GOVERNING LAW</a>
            <a class="toc-link" href="#disputes">12. DISPUTE RESOLUTION</a>
            <a class="toc-link" href="#corrections">13. CORRECTIONS</a>
            <a class="toc-link" href="#ai">14. AI-GENERATED CONTENT AND ADVERTISING</a>
            <a class="toc-link" href="#security">15. SECURITY AND BOT PROTECTION</a>
            <a class="toc-link" href="#disclaimer">16. DISCLAIMER</a>
            <a class="toc-link" href="#liability">17. LIMITATIONS OF LIABILITY</a>
            <a class="toc-link" href="#indemnification">18. INDEMNIFICATION</a>
            <a class="toc-link" href="#userdata">19. USER DATA</a>
            <a class="toc-link" href="#electronic">20. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</a>
            <a class="toc-link" href="#misc">21. MISCELLANEOUS</a>
            <a class="toc-link" href="#contact">22. CONTACT US</a>
          </div>

          <h2 id="services">1. OUR SERVICES</h2>
          <p>The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>

          <h2 id="ip">2. INTELLECTUAL PROPERTY RIGHTS</h2>
          <h3>Our intellectual property</h3>
          <p>We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").</p>
          <p>Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties around the world.</p>
          <p><strong>Third-Party Trademarks:</strong> All third-party trademarks, service marks, logos, and brand names used on the Services (including but not limited to TikTok, LinkedIn, Facebook, Instagram, X, and Google) are the property of their respective owners. Use of these names, trademarks, and brands does not imply endorsement.</p>
          <h3>Your use of our Services</h3>
          <p>Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive, non-transferable, revocable license to:</p>
          <ul>
            <li>access the Services; and</li>
            <li>download or print a copy of any portion of the Content to which you have properly gained access,</li>
          </ul>
          <p>solely for your personal, non-commercial use or internal business purpose.</p>

          <h2 id="userreps">3. USER REPRESENTATIONS</h2>
          <p>By using the Services, you represent and warrant that: (1) you have the legal capacity and you agree to comply with these Legal Terms; (2) you are not a minor in the jurisdiction in which you reside; (3) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (4) you will not use the Services for any illegal or unauthorized purpose; and (5) your use of the Services will not violate any applicable law or regulation.</p>

          <h2 id="prohibited">4. PROHIBITED ACTIVITIES</h2>
          <p>You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>

          <h2 id="ugc">5. USER GENERATED CONTRIBUTIONS</h2>
          <p>The Services may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions").</p>

          <h2 id="license">6. CONTRIBUTION LICENSE</h2>
          <p>You and BeatGangsta agree that we may access, store, process, and use any information and personal data that you provide and your choices (including settings).</p>
          <p>By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any purpose without compensation to you.</p>

          <h2 id="google">7. GOOGLE SERVICES AND SOCIAL MEDIA PLATFORMS</h2>
          <p><strong>Google Sign-In:</strong> By using Google Sign-In, you authorize us to access your basic profile information (name, email, profile picture) for authentication purposes. <strong>Google Sign-In is mandatory to access AI-powered features and cloud synchronization services. There is no completely local storage mode for these specific functions.</strong></p>
          <p><strong>Google Drive:</strong> Our backup feature uses the Google Drive API. We only request access to files created by our application (<code>drive.file</code> scope). You maintain full ownership of your data. You can revoke access at any time through your Google Account security settings.</p>
          <p><strong>Social Media Platforms:</strong> Your use of social media features (e.g., clicking "Follow" or "Share" links) is governed by the terms and privacy policies of the respective platforms (TikTok, LinkedIn, Facebook, Instagram, X). You agree to comply with all third-party terms of service when interacting with our brand on these platforms.</p>

          <h2 id="sitemanage">8. SERVICES MANAGEMENT</h2>
          <p>We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</p>

          <h2 id="terms">9. TERM AND TERMINATION</h2>
          <p>These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON.</p>

          <h2 id="modifications">10. MODIFICATIONS AND INTERRUPTIONS</h2>
          <p>We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</p>

          <h2 id="law">11. GOVERNING LAW</h2>
          <p>These Legal Terms shall be governed by and defined following the laws of the State of California and the United States. BeatGangsta and yourself irrevocably consent that the courts of California and the United States shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</p>

          <h2 id="disputes">12. DISPUTE RESOLUTION</h2>
          <h3>Informal Negotiations</h3>
          <p>To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute" and collectively, the "Disputes"), the Parties agree to first attempt to negotiate any Dispute informally for at least 30 days before initiating arbitration.</p>

          <h2 id="corrections">13. CORRECTIONS</h2>
          <p>There may be information on the Services that contains typographical errors, inaccuracies, or omissions. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</p>

          <h2 id="ai">14. AI-GENERATED CONTENT AND ADVERTISING</h2>
          <p><strong>AI Content:</strong> Our Services utilize the Google Gemini API to generate content. You acknowledge that AI-generated content may be inaccurate, incomplete, or biased. We do not guarantee the accuracy of any AI-generated output. <strong>Access to AI content generation requires a mandatory Google Sign-In.</strong> You agree that BeatGangsta is not liable for any damages or losses resulting from your reliance on AI-generated content.</p>
          <p><strong>Advertising:</strong> We use Google AdSense to serve advertisements. Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our sites and/or other sites on the Internet.</p>

          <h2 id="security">15. SECURITY AND BOT PROTECTION</h2>
          <p>We utilize Cloudflare Turnstile to protect our Services from automated abuse and spam. By accessing our Services, you agree to comply with Cloudflare's security measures and acknowledge that your interaction with the verification process is subject to Cloudflare's terms and privacy policies.</p>

          <h2 id="disclaimer">16. DISCLAIMER</h2>
          <p>THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF.</p>

          <h2 id="liability">17. LIMITATIONS OF LIABILITY</h2>
          <p>IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES.</p>

          <h2 id="indemnification">18. INDEMNIFICATION</h2>
          <p>You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand.</p>

          <h2 id="userdata">19. USER DATA</h2>
          <p>We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services.</p>

          <h2 id="electronic">20. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2>
          <p>Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications.</p>

          <h2 id="misc">21. MISCELLANEOUS</h2>
          <p>These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us.</p>

          <h2 id="contact">22. CONTACT US</h2>
          <p>In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>
          <p>
            <strong>BeatGangsta</strong><br>
            Email: <a href="mailto:legal@beatgangsta.com">legal@beatgangsta.com</a><br>
            Web: <a href="http://www.beatgangsta.com" target="_blank">www.beatgangsta.com</a> (Contact form at bottom of page)
          </p>

          <footer>
              <p>&copy; 2026 BeatGangsta. All rights reserved.</p>
          </footer>
      </body>
      </html>
    `);
  });

  app.get("/cookies", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cookie Policy - BeatGangsta</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
              h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
              h2 { margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              footer { margin-top: 50px; font-size: 0.8em; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
      </head>
      <body>
          <h1>Cookie Policy</h1>
          <p>Last updated: March 21, 2026</p>
          <p>BeatGangsta uses cookies and similar technologies to provide and improve our services. This policy explains how we use these technologies.</p>
          
          <h2>1. What are Cookies?</h2>
          <p>Cookies are small text files that are stored on your device when you visit a website. They help the website recognize your device and remember information about your visit.</p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
              <li><strong>Authentication:</strong> To keep you logged in via Google OAuth.</li>
              <li><strong>Preferences:</strong> To remember your theme settings and UI preferences.</li>
              <li><strong>Security:</strong> To protect your account and our services.</li>
          </ul>

          <h2>3. Managing Cookies</h2>
          <p>Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>

          <footer>
              <p>&copy; 2026 BeatGangsta. All rights reserved.</p>
          </footer>
      </body>
      </html>
    `);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // --- Cloud Backup/Restore Routes ---
  
  async function getOrCreateFolder(drive: any, folderName: string, parentId?: string) {
    try {
      // Escape single quotes for Google Drive query
      const escapedName = folderName.replace(/'/g, "\\'");
      const query = parentId 
        ? `name = '${escapedName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
        : `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
      console.log(`getOrCreateFolder: Searching for folder "${folderName}" (parentId: ${parentId || 'root'})`);
      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
      });
      
      if (res.data.files && res.data.files.length > 0) {
        console.log(`getOrCreateFolder: Found existing folder "${folderName}" with ID: ${res.data.files[0].id}`);
        return res.data.files[0].id;
      }
      
      console.log(`getOrCreateFolder: Folder "${folderName}" not found, creating it...`);
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      };
      
      const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
      });
      
      console.log(`getOrCreateFolder: Created folder "${folderName}" with ID: ${folder.data.id}`);
      return folder.data.id;
    } catch (error: any) {
      console.error(`getOrCreateFolder: Error for "${folderName}":`, error.message || error);
      throw error;
    }
  }

  async function makePublic(drive: any, fileId: string) {
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log(`makePublic: File/Folder ${fileId} is now public (anyone with link).`);
    } catch (error: any) {
      // Ignore errors if permission already exists or other non-critical issues
      console.warn(`makePublic: Could not set public permission for ${fileId}:`, error.message);
    }
  }

  async function uploadFileToFolder(drive: any, fileName: string, mimeType: string, content: string, parentId: string) {
    try {
      const escapedName = fileName.replace(/'/g, "\\'");
      const res = await drive.files.list({
        q: `name = '${escapedName}' and '${parentId}' in parents and trashed = false`,
        fields: 'files(id)'
      });
      
      const media = {
        mimeType: mimeType,
        body: content
      };
      
      if (res.data.files && res.data.files.length > 0) {
        console.log(`uploadFileToFolder: Updating existing file "${fileName}" (ID: ${res.data.files[0].id})`);
        await drive.files.update({
          fileId: res.data.files[0].id,
          media: media
        });
      } else {
        console.log(`uploadFileToFolder: Creating new file "${fileName}" in folder ${parentId}`);
        await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [parentId]
          },
          media: media
        });
      }
    } catch (error: any) {
      console.error(`uploadFileToFolder: Error for "${fileName}":`, error.message || error);
      throw error;
    }
  }

  async function getFileFromFolder(drive: any, fileName: string, parentId: string) {
    const res = await drive.files.list({
      q: `name = '${fileName}' and '${parentId}' in parents and trashed = false`,
      fields: 'files(id)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      spaces: 'drive'
    });
    if (res.data.files && res.data.files.length > 0) {
      const fileId = res.data.files[0].id;
      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media',
        supportsAllDrives: true
      });
      return response.data;
    }
    return null;
  }

  // Helper to format Google API errors for BYOK users
  const handleGoogleError = (res: any, error: any, context: string) => {
    console.error(`${context}: Failed`, error.message || error);
    
    let message = `Failed to ${context.toLowerCase()}.`;
    let details = error.message || "Unknown error";
    
    // Check for "API not enabled" error
    if (details.includes("disabled") || details.includes("not been used in project")) {
      message = "Google Drive API is not enabled for your project.";
      details = "As the App Owner, you must enable the Drive API in your Google Cloud Console. Regular users will not see this error once you enable it. " + details;
    }

    res.status(500).json({ error: message, details });
  };

  app.post("/api/cloud/backup", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data, preferences } = req.body;
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      console.log("Manual Backup: Starting...");
      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      
      // Make the root backup folder public so friends can sync from it
      await makePublic(drive, rootFolderId);
      
      // If preferences aren't provided, assume full backup
      const backupPrefs = preferences || { gear: true, settings: true, recipes: true, critiques: true };

      if (backupPrefs.settings && data.ui) {
        console.log("Manual Backup: Saving settings...");
        const settingsFolderId = await getOrCreateFolder(drive, 'Settings', rootFolderId);
        await uploadFileToFolder(drive, 'settings.json', 'application/json', JSON.stringify(data.ui, null, 2), settingsFolderId);
      }

      if (backupPrefs.gear && data.gear) {
        console.log("Manual Backup: Saving gear...");
        const gearFolderId = await getOrCreateFolder(drive, 'Gear', rootFolderId);
        await uploadFileToFolder(drive, 'gear.json', 'application/json', JSON.stringify(data.gear, null, 2), gearFolderId);
      }

      if (backupPrefs.recipes && data.vault && data.vault.recipes) {
        console.log("Manual Backup: Saving recipes...");
        const recipesFolderId = await getOrCreateFolder(drive, 'Recipes', rootFolderId);
        for (const recipe of data.vault.recipes) {
          const safeName = recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const recipeFolderId = await getOrCreateFolder(drive, safeName, recipesFolderId);
          await uploadFileToFolder(drive, 'recipe.json', 'application/json', JSON.stringify(recipe, null, 2), recipeFolderId);
        }
      }

      if (backupPrefs.critiques && data.vault && data.vault.critiques) {
        console.log("Manual Backup: Saving critiques...");
        const critiquesFolderId = await getOrCreateFolder(drive, 'Critiques', rootFolderId);
        for (const critique of data.vault.critiques) {
          const safeName = critique.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const critiqueFolderId = await getOrCreateFolder(drive, safeName, critiquesFolderId);
          await uploadFileToFolder(drive, 'critique.json', 'application/json', JSON.stringify(critique, null, 2), critiqueFolderId);
        }
      }

      console.log("Manual Backup: Success!");
      res.json({ success: true, folderUrl: `https://drive.google.com/drive/folders/${rootFolderId}` });
    } catch (error: any) {
      handleGoogleError(res, error, "Manual Backup");
    }
  });

  app.get("/api/cloud/fetch-rig", async (req, res) => {
    const { folderId } = req.query;
    if (!folderId || typeof folderId !== 'string') {
      return res.status(400).json({ error: "Folder ID is required" });
    }

    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      console.log(`Fetch Rig: Attempting to fetch from folder ${folderId}`);
      
      // First, try to get the folder itself to verify access
      let folderMeta;
      try {
        const res = await drive.files.get({ 
          fileId: folderId, 
          fields: 'id, name, mimeType',
          supportsAllDrives: true 
        });
        folderMeta = res.data;
        console.log(`Fetch Rig: Found folder "${folderMeta.name}" (${folderMeta.mimeType})`);
      } catch (e: any) {
        console.error("Fetch Rig: Could not access the provided folder ID:", e.message);
        return res.status(404).json({ 
          error: "Could not access the provided rig link. Make sure it is shared correctly (Anyone with the link) and that you are logged in.",
          details: e.message 
        });
      }

      // If the user shared the 'Gear' folder directly
      if (folderMeta.name === 'Gear') {
        console.log("Fetch Rig: User shared the 'Gear' folder directly.");
        const gearData = await getFileFromFolder(drive, 'gear.json', folderId);
        if (!gearData) {
          return res.status(404).json({ error: "gear.json not found in the provided Gear folder." });
        }
        return res.json({ success: true, gear: gearData, recipes: [] });
      }

      // List all children to be sure we find what we need
      const childrenRes = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        spaces: 'drive'
      });

      const children = childrenRes.data.files || [];
      console.log(`Fetch Rig: Found ${children.length} items in folder ${folderId}`);
      
      // Check if gear.json is directly in this folder (maybe they shared the Gear folder but it's named differently)
      const directGearData = children.find(f => f.name === 'gear.json');
      if (directGearData) {
        console.log("Fetch Rig: Found gear.json directly in the shared folder.");
        const response = await drive.files.get({
          fileId: directGearData.id,
          alt: 'media',
          supportsAllDrives: true
        });
        return res.json({ success: true, gear: response.data, recipes: [] });
      }

      const gearFolder = children.find(f => f.name === 'Gear' && f.mimeType === 'application/vnd.google-apps.folder');
      
      if (!gearFolder) {
        console.warn(`Fetch Rig: 'Gear' folder not found among children: ${children.map(c => c.name).join(', ')}`);
        return res.status(404).json({ error: "Gear folder not found in the provided rig link. Make sure your friend has performed a backup and shared the correct folder." });
      }

      const gearFolderId = gearFolder.id!;
      const gearData = await getFileFromFolder(drive, 'gear.json', gearFolderId);
      
      if (!gearData) {
        return res.status(404).json({ error: "gear.json not found inside the Gear folder." });
      }

      const recipes: any[] = [];
      const recipesFolder = children.find(f => f.name === 'Recipes' && f.mimeType === 'application/vnd.google-apps.folder');

      if (recipesFolder) {
        const recipesFolderId = recipesFolder.id!;
        const recipeFoldersRes = await drive.files.list({ 
          q: `'${recipesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, 
          fields: 'files(id)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          spaces: 'drive'
        });
        
        for (const folder of recipeFoldersRes.data.files || []) {
          const recipeData = await getFileFromFolder(drive, 'recipe.json', folder.id!);
          if (recipeData) recipes.push(recipeData);
        }
      }

      res.json({ success: true, gear: gearData, recipes });
    } catch (error: any) {
      handleGoogleError(res, error, "Fetch Friend Rig");
    }
  });

  app.post("/api/cloud/backup/recipe", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { recipe, midiFiles, loopFiles } = req.body;
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      // Ensure root is public
      await makePublic(drive, rootFolderId);
      
      const recipesFolderId = await getOrCreateFolder(drive, 'Recipes', rootFolderId);
      const safeName = recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const recipeFolderId = await getOrCreateFolder(drive, safeName, recipesFolderId);

      await uploadFileToFolder(drive, 'recipe.json', 'application/json', JSON.stringify(recipe, null, 2), recipeFolderId);

      if (midiFiles && midiFiles.length > 0) {
        const midiFolderId = await getOrCreateFolder(drive, 'MIDI', recipeFolderId);
        for (const file of midiFiles) {
          await uploadFileToFolder(drive, file.name, 'audio/midi', Buffer.from(file.data, 'base64').toString('binary'), midiFolderId);
        }
      }

      if (loopFiles && loopFiles.length > 0) {
        const loopsFolderId = await getOrCreateFolder(drive, 'Musicloops', recipeFolderId);
        for (const file of loopFiles) {
          await uploadFileToFolder(drive, file.name, 'application/octet-stream', Buffer.from(file.data, 'base64').toString('binary'), loopsFolderId);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      handleGoogleError(res, error, "Recipe Backup");
    }
  });

  app.post("/api/cloud/backup/critique", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { critique } = req.body;
    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      const rootFolderId = await getOrCreateFolder(drive, 'Beatgangsta Backups');
      // Ensure root is public
      await makePublic(drive, rootFolderId);
      
      const critiquesFolderId = await getOrCreateFolder(drive, 'Critiques', rootFolderId);
      const safeName = critique.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const critiqueFolderId = await getOrCreateFolder(drive, safeName, critiquesFolderId);

      await uploadFileToFolder(drive, 'critique.json', 'application/json', JSON.stringify(critique, null, 2), critiqueFolderId);

      res.json({ success: true });
    } catch (error: any) {
      handleGoogleError(res, error, "Critique Backup");
    }
  });

  app.get("/api/cloud/restore", async (req, res) => {
    if (!req.session || !req.session.tokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const google = await getGoogleInstance();
    const { clientId, clientSecret } = getGoogleCredentials();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Force token refresh if needed
      const { token } = await auth.getAccessToken();
      if (token && req.session.tokens.access_token !== token) {
        req.session.tokens.access_token = token;
      }

      const rootRes = await drive.files.list({
        q: `name = 'Beatgangsta Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)'
      });

      if (!rootRes.data.files || rootRes.data.files.length === 0) {
        return res.status(404).json({ error: "No backup found in cloud." });
      }

      const rootFolderId = rootRes.data.files[0].id;
      const restoredData: any = { version: "1.0", timestamp: Date.now(), vault: { recipes: [], critiques: [] } };

      // Get Settings
      const settingsFolderRes = await drive.files.list({ q: `name = 'Settings' and '${rootFolderId}' in parents and trashed = false`, fields: 'files(id)' });
      if (settingsFolderRes.data.files && settingsFolderRes.data.files.length > 0) {
        const settingsData = await getFileFromFolder(drive, 'settings.json', settingsFolderRes.data.files[0].id!);
        if (settingsData) restoredData.uiSettings = settingsData;
      }

      // Get Gear
      const gearFolderRes = await drive.files.list({ q: `name = 'Gear' and '${rootFolderId}' in parents and trashed = false`, fields: 'files(id)' });
      if (gearFolderRes.data.files && gearFolderRes.data.files.length > 0) {
        const gearData = await getFileFromFolder(drive, 'gear.json', gearFolderRes.data.files[0].id!);
        if (gearData) restoredData.gear = gearData;
      }

      // Get Recipes
      const recipesFolderRes = await drive.files.list({ q: `name = 'Recipes' and '${rootFolderId}' in parents and trashed = false`, fields: 'files(id)' });
      if (recipesFolderRes.data.files && recipesFolderRes.data.files.length > 0) {
        const recipesFolderId = recipesFolderRes.data.files[0].id!;
        const recipeFolders = await drive.files.list({ q: `'${recipesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id, name)' });
        
        if (recipeFolders.data.files) {
          for (const folder of recipeFolders.data.files) {
            const recipeData = await getFileFromFolder(drive, 'recipe.json', folder.id!);
            if (recipeData) restoredData.vault.recipes.push(recipeData);
          }
        }
      }

      // Get Critiques
      const critiquesFolderRes = await drive.files.list({ q: `name = 'Critiques' and '${rootFolderId}' in parents and trashed = false`, fields: 'files(id)' });
      if (critiquesFolderRes.data.files && critiquesFolderRes.data.files.length > 0) {
        const critiquesFolderId = critiquesFolderRes.data.files[0].id!;
        const critiqueFolders = await drive.files.list({ q: `'${critiquesFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id, name)' });
        
        if (critiqueFolders.data.files) {
          for (const folder of critiqueFolders.data.files) {
            const critiqueData = await getFileFromFolder(drive, 'critique.json', folder.id!);
            if (critiqueData) restoredData.vault.critiques.push(critiqueData);
          }
        }
      }

      res.json({ data: restoredData });
    } catch (error: any) {
      handleGoogleError(res, error, "Cloud Restore");
    }
  });

  app.post("/api/verify-turnstile", async (req, res) => {
    const token = req.body["cf-turnstile-response"];
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    if (!secretKey) {
      console.warn("TURNSTILE_SECRET_KEY is not set. Skipping verification (DEV ONLY).");
      return res.json({ success: true });
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);

      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const data = await response.json();

      if (data.success) {
        res.json({ success: true });
      } else {
        console.error("Turnstile verification failed:", data);
        res.status(403).json({ 
          error: "Security verification failed.", 
          details: data['error-codes'] ? data['error-codes'].join(', ') : 'Unknown error'
        });
      }
    } catch (error) {
      console.error("Turnstile verification error:", error);
      res.status(500).json({ error: "Internal server error during verification" });
    }
  });

// Catch-all for undefined API routes
app.all(/\/api\/.*/, (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  // Serve static files in production (only if not on Vercel, as Vercel handles static files)
  app.use(express.static(path.join(__dirname, "dist")));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
