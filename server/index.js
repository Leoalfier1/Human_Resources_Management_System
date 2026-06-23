const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- 1. IMPORT ROUTES ---
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/rsp/dashboard');
const vacancyRoutes = require('./routes/rsp/vacancies');
const applicantRoutes = require('./routes/rsp/applicants');
const evaluationRoutes = require('./routes/rsp/evaluation');

const app = express();
const server = http.createServer(app);

// --- 2. INITIALIZE SOCKET.IO ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your React Vite URL
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

// Make socket.io accessible to our controllers/routes
app.set('socketio', io);

// --- 3. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the "uploads" folder so the frontend can open PDFs
// Access via: http://localhost:5000/uploads/division-memos/filename.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. MOUNT API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/rsp/dashboard', dashboardRoutes);
app.use('/api/rsp/vacancies', vacancyRoutes);
app.use('/api/rsp/applicants', applicantRoutes);
app.use('/api/rsp/evaluation', evaluationRoutes);

// Root route for testing
app.get('/', (req, res) => {
    res.send('DepEd HRMIS API is Running...');
});

// --- 5. SOCKET CONNECTION LOG ---
io.on('connection', (socket) => {
    console.log('⚡ A user connected to Real-time Updates:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected from Socket');
    });
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server flying on http://localhost:${PORT}`);
    console.log(`📂 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});