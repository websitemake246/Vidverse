import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import multer from "multer";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Low(new JSONFile("db.json"), { users: [], videos: [] });
await db.read();

// Middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "stream-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Multer setup for video uploads
const upload = multer({
  dest: "public/uploads/",
  limits: { fileSize: 500 * 1024 * 1024 },
});

// Ensure default admin
if (!db.data.users.find((u) => u.username === "kingkhalid")) {
  db.data.users.push({
    username: "kingkhalid",
    password: "312032",
    isAdmin: true,
  });
  await db.write();
}

// Auth middleware
function authRequired(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Routes
app.get("/", async (req, res) => {
  await db.read();
  const videos = db.data.videos;
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views/login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views/signup.html")));
app.get("/admin", authRequired, (req, res) => res.sendFile(path.join(__dirname, "views/admin.html")));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = db.data.users.find((u) => u.username === username && u.password === password);
  if (user) {
    req.session.user = user;
    res.redirect(user.isAdmin ? "/admin" : "/");
  } else res.send("Invalid login");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  if (db.data.users.find((u) => u.username === username)) return res.send("User exists");
  db.data.users.push({ username, password, isAdmin: false });
  await db.write();
  res.redirect("/login");
});

app.post("/upload", authRequired, upload.single("video"), async (req, res) => {
  if (!req.session.user.isAdmin) return res.send("Not authorized");
  const { title, description } = req.body;
  const file = req.file;
  db.data.videos.push({
    id: nanoid(),
    title,
    description,
    filename: file.filename,
    likes: 0,
    comments: [],
  });
  await db.write();
  res.redirect("/admin");
});

app.get("/watch/:id", async (req, res) => {
  await db.read();
  const video = db.data.videos.find((v) => v.id === req.params.id);
  if (!video) return res.send("Video not found");
  res.sendFile(path.join(__dirname, "views/video.html"));
});

app.post("/like/:id", authRequired, async (req, res) => {
  await db.read();
  const video = db.data.videos.find((v) => v.id === req.params.id);
  if (video) {
    video.likes++;
    await db.write();
    res.json({ likes: video.likes });
  } else res.status(404).json({ error: "Not found" });
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
