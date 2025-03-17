const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const vehicleRoutes = require("./routes/vehicle");
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificate");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

// --- CORS Setup ---
app.use(cors({
  credentials: true,
  origin: "https://cmppl-staging.onrender.com",  // Frontend URL
}));

// --- MongoDB Atlas Connection ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);  // Exit the process with an error code
  });

// --- Session Middleware ---
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY,  // Use your secret key from .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),  // Store sessions in MongoDB Atlas
  cookie: {
    secure: false,  // Set to false for testing, true for production with HTTPS
    httpOnly: true,
    sameSite: 'Lax',  // Required for cross-origin cookies
  },
});

app.use(sessionMiddleware);

// --- Initialize Socket.IO ---
const io = socketIo(server, {
  cors: {
    origin: "https://cmppl-staging.onrender.com",  // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,               // Allow credentials (cookies)
  },
});

// Attach the session middleware to Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Attach Socket.IO instance to the app instance
app.set("io", io);

// --- Express Middleware ---
app.use(express.json());
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/certificate", certificateRoutes);

// --- Serve Static Files (Frontend) ---
app.use(express.static(path.join(__dirname, 'vehicle-tracking-frontend')));

// --- Serve Index Page ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'vehicle-tracking-frontend', 'index.html'));
});

// --- Serve Admin Page ---
app.get('/admin.html', (req, res) => {
  console.log('Admin page request:', req.session);
  if (req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, 'vehicle-tracking-frontend', 'admin.html'));
  } else {
    res.redirect('/login.html');
  }
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'vehicle-tracking-frontend', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

// --- Socket.IO Connection ---
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Access the session from the socket
  const session = socket.request.session;
  console.log('Session from socket:', session);

  if (session && session.isAuthenticated) {
    console.log('User is authenticated via socket!');
  } else {
    console.log('User is NOT authenticated via socket.');
  }

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// --- Start the Server ---
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
