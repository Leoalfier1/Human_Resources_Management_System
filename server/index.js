require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. https://prime-hrm.vercel.app
  credentials: true
}));
const path = require('path');
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 30000,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// 1. SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});


app.set('socketio', io);

// 2. MIDDLEWARE
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
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

// 4. ROUTE REGISTRATION — each route is loaded independently so failures are clearly logged
function registerRoute(path, routePath) {
    try {
        app.use(path, require(routePath));
        console.log(`  ✅ ${path}`);
    } catch (err) {
        console.error(`  ❌ FAILED to load route ${path} from ${routePath}: ${err.message}`);
        process.exit(1);
    }
}

console.log('📦 Registering routes...');

// Auth
registerRoute('/api/auth', './routes/auth');
registerRoute('/api/branding', './routes/branding');

// Admin user management & profile
registerRoute('/api/admin', './routes/admin');
registerRoute('/api/profile', './routes/profile');

// Applicant-facing routes
registerRoute('/api/vacancies', './routes/applicant/vacancies');
registerRoute('/api/applications', './routes/applicant/applications');
registerRoute('/api/applicant/pds', './routes/applicant/pds');

// Admin RSP routes
registerRoute('/api/rsp/dashboard', './routes/rsp/dashboard');
registerRoute('/api/rsp/vacancies', './routes/rsp/vacancies');
registerRoute('/api/rsp/applicants', './routes/rsp/applicants');
registerRoute('/api/rsp/evaluation', './routes/rsp/evaluation');
registerRoute('/api/rsp/comparative-assessment', './routes/rsp/comparative-assessment');
registerRoute('/api/rsp/ca-workspace', './routes/rsp/ca-workspace');
registerRoute('/api/rsp/ies', './routes/rsp/ies');
registerRoute('/api/rsp/results', './routes/rsp/results');
registerRoute('/api/rsp/deliberation', './routes/rsp/deliberation');
registerRoute('/api/rsp/congratulatory-advice', './routes/rsp/advice');
registerRoute('/api/rsp/appointment', './routes/rsp/appointment');
registerRoute('/api/rsp/notice-of-appointment', './routes/rsp/notice');
registerRoute('/api/rsp/eligibility', './routes/rsp/eligibility');
registerRoute('/api/rsp/appeals', './routes/rsp/appeals');

// L&D routes
registerRoute('/api/ld/tna', './routes/ld/tna');
registerRoute('/api/ld/objectives', './routes/ld/objectives');
registerRoute('/api/ld/plans', './routes/ld/plans');
registerRoute('/api/ld/programs', './routes/ld/programs');
registerRoute('/api/ld/evaluation', './routes/ld/evaluation');

// PM routes
registerRoute('/api/pm/periods', './routes/pm/periods');
registerRoute('/api/pm/commitments', './routes/pm/commitments');
registerRoute('/api/pm/coaching', './routes/pm/coaching');
registerRoute('/api/pm/ratings', './routes/pm/ratings');
registerRoute('/api/pm/rewards', './routes/pm/rewards');

// R&R routes
registerRoute('/api/rr/praise-meetings', './routes/rr/praise-meetings');
registerRoute('/api/rr/call-for-nominees', './routes/rr/call-for-nominees');
registerRoute('/api/rr/preliminary-evaluation', './routes/rr/preliminary-evaluation');
registerRoute('/api/rr/searches', './routes/rr/searches');
registerRoute('/api/rr/nominations', './routes/rr/nominations');
registerRoute('/api/rr/evaluation', './routes/rr/evaluation');
registerRoute('/api/rr/validation', './routes/rr/validation-interview');
registerRoute('/api/rr/deliberation', './routes/rr/deliberation');
registerRoute('/api/rr/deliberation2', './routes/rr/deliberation-finalization');
registerRoute('/api/rr/awards', './routes/rr/awards');
registerRoute('/api/rr/announcement', './routes/rr/announcement');
registerRoute('/api/rr/ceremony', './routes/rr/ceremony');
registerRoute('/api/rr/implementation-report', './routes/rr/implementation-report');
registerRoute('/api/rr/reports', './routes/rr/reports');
registerRoute('/api/rr/opportunities', './routes/rr/opportunities');

// Personnel Module routes
registerRoute('/api/personnel/employees', './routes/personnel/employee');
registerRoute('/api/personnel/documents', './routes/personnel/documents');
registerRoute('/api/personnel/leave', './routes/personnel/leave');
registerRoute('/api/personnel/travel', './routes/personnel/travel');
registerRoute('/api/personnel/certificates', './routes/personnel/certificates');
registerRoute('/api/personnel/notifications', './routes/personnel/notifications');
registerRoute('/api/personnel/reports', './routes/personnel/reports');
registerRoute('/api/personnel/signatories', './routes/personnel/signatory');
registerRoute('/api/personnel/admin-tools', './routes/personnel/adminTools');
registerRoute('/api/personnel/schools-offices', './routes/personnel/schoolsOffices');

console.log("✅ All routes registered successfully");

// 5. SOCKET.IO
io.on('connection', (socket) => {
    console.log(`📡 A user connected: ${socket.id}`);

    // Join a room — used by frontend to subscribe to application-specific updates
    socket.on('join-application-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined room: ${roomName}`);
    });

    // Leave an application room when navigating away
    socket.on('leave-application-room', (roomName) => {
        socket.leave(roomName);
        console.log(`📡 ${socket.id} left room: ${roomName}`);
    });

    // L&D module room
    socket.on('join-ld-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined L&D room: ${roomName}`);
    });

    // IES room — join by evaluation ID for live score/status updates
    socket.on('join-ies-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined IES room: ${roomName}`);
    });

    socket.on('leave-ies-room', (roomName) => {
        socket.leave(roomName);
        console.log(`📡 ${socket.id} left IES room: ${roomName}`);
    });

    // CA workspace room — join by vacancy ID for live score updates
    socket.on('join-ca-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined CA room: ${roomName}`);
    });

    socket.on('leave-ca-room', (roomName) => {
        socket.leave(roomName);
        console.log(`📡 ${socket.id} left CA room: ${roomName}`);
    });

    // R&R module room
    socket.on('join-rr-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined R&R room: ${roomName}`);
    });

    // User-specific room (e.g. rr-user-{userId}) for targeted notifications
    socket.on('join-user-room', (roomName) => {
        socket.join(roomName);
        console.log(`📡 ${socket.id} joined user room: ${roomName}`);
    });

    // Leave a user room
    socket.on('leave-user-room', (roomName) => {
        socket.leave(roomName);
        console.log(`📡 ${socket.id} left user room: ${roomName}`);
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

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${PORT} is already in use by another process.`);
                console.error(`   Run these commands to fix it:`);
                console.error(`   > netstat -ano | findstr :${PORT}`);
                console.error(`   > taskkill /PID <PID_from_above> /F`);
                console.error(`   Then re-run: node index.js\n`);
            } else {
                console.error('❌ Server error:', err.message);
            }
            process.exit(1);
        });
    } catch (err) {
        console.error('❌ DB CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

start();
