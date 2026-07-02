require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// 1. SOCKET.IO SETUP
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true
    }
});

app.set('socketio', io);

// 2. MIDDLEWARE
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// 4. ROUTE REGISTRATION
try {
    // Auth
    app.use('/api/auth',    require('./routes/auth'));
    app.use('/api/branding', require('./routes/branding'));

    // Applicant-facing routes
    app.use('/api/vacancies',    require('./routes/applicant/vacancies'));
    app.use('/api/applications', require('./routes/applicant/applications'));
    app.use('/api/applicant/pds', require('./routes/applicant/pds'));

    // Admin RSP routes
    app.use('/api/rsp/dashboard',              require('./routes/rsp/dashboard'));
    app.use('/api/rsp/vacancies',              require('./routes/rsp/vacancies'));
    app.use('/api/rsp/applicants',             require('./routes/rsp/applicants'));
    app.use('/api/rsp/evaluation',             require('./routes/rsp/evaluation'));
    app.use('/api/rsp/comparative-assessment', require('./routes/rsp/comparative-assessment'));
    app.use('/api/rsp/results',                require('./routes/rsp/results'));
    app.use('/api/rsp/deliberation',           require('./routes/rsp/deliberation'));
    app.use('/api/rsp/congratulatory-advice',  require('./routes/rsp/advice'));
    app.use('/api/rsp/appointment',            require('./routes/rsp/appointment'));
    app.use('/api/rsp/notice-of-appointment',  require('./routes/rsp/notice'));

    console.log("✅ All routes registered successfully");
} catch (err) {
    console.error("❌ ROUTE LOADING ERROR:", err.message);
    console.error(err.stack); // full stack so you can pinpoint the exact file
}

// 5. SOCKET.IO
io.on('connection', (socket) => {
    console.log(`📡 A user connected: ${socket.id}`);

    socket.on('join-application-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined room: ${roomName}`);
    });

    socket.on('disconnect', () => {
        console.log('📡 User disconnected');
    });
});

// 6. START SERVER
const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await db.query('SELECT 1');
        console.log('✅ MySQL Connected (Laragon)');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ DB CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

start();