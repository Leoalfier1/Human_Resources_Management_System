const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- 1. IMPORT ROUTES ---
// Auth & RSP Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/rsp/dashboard');
const vacancyRoutes = require('./routes/rsp/vacancies');
const applicantRoutes = require('./routes/rsp/applicants');
const evaluationRoutes = require('./routes/rsp/evaluation');

// PM Module Routes
const pmDashboardRoutes = require('./routes/pm/dashboard');
const pmPlanningRoutes = require('./routes/pm/planning');
const pmReviewRoutes = require('./routes/pm/review');
const pmMonitoringRoutes = require('./routes/pm/monitoring');
const pmRewardingRoutes = require('./routes/pm/rewarding');
const pmFormConfigRoutes = require('./routes/pm/form-config');
const pmNotificationsRoutes = require('./routes/pm/notifications');
const pmEmployeeRoutes = require('./routes/pm/employee');
const pmPerformanceRoutes = require('./routes/pm/performance');
const employeeNotificationsRoutes = require('./routes/employee-notifications');
const ldRoutes = require('./routes/pm/ld');

// --- 2. INITIALIZE APP & SERVER ---
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

// Make socket.io accessible to our controllers/routes via req.app.get('socketio')
app.set('socketio', io);

// --- 3. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static folders for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Create this folder if it doesn't exist: server/uploads/pm_movs
app.use('/uploads/pm_movs', express.static(path.join(__dirname, 'uploads/pm_movs')));

// --- 4. MOUNT API ROUTES ---
// RSP Routes
app.use('/api/auth', authRoutes);
app.use('/api/rsp/dashboard', dashboardRoutes);
app.use('/api/rsp/vacancies', vacancyRoutes);
app.use('/api/rsp/applicants', applicantRoutes);
app.use('/api/rsp/evaluation', evaluationRoutes);

// PM Module Routes
app.use('/api/pm/dashboard', pmDashboardRoutes);
app.use('/api/pm/planning', pmPlanningRoutes);
app.use('/api/pm/review', pmReviewRoutes);
app.use('/api/pm/monitoring', pmMonitoringRoutes);
app.use('/api/pm/coaching', pmMonitoringRoutes);
app.use('/api/pm/feedback', pmMonitoringRoutes);
app.use('/api/pm/rewarding', pmRewardingRoutes);
app.use('/api/pm/form-config', pmFormConfigRoutes);
app.use('/api/pm/config', pmFormConfigRoutes);
app.use('/api/pm/notifications', pmNotificationsRoutes);
app.use('/api/pm/employee', pmEmployeeRoutes);
app.use('/api/pm/performance', pmPerformanceRoutes);
app.use('/api/notifications', employeeNotificationsRoutes);
app.use('/api/ld', ldRoutes);

// Root route for testing
app.get('/', (req, res) => {
    res.send('DepEd HRMIS API is Running with PM Module...');
});

// --- 5. SOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log('⚡ User connected to Real-time Updates:', socket.id);
    
    socket.on('join_employee_room', (userId) => {
        if (userId) {
            socket.join(String(userId));
            console.log(`Employee ${userId} joined room ${userId}`);
        }
    });

    socket.on('join_admin_room', () => {
        socket.join('admin_notifications');
        socket.join('admin_room');
        console.log(`Admin joined notification room`);
    });

    socket.on('submit_ipcrf', (data) => {
        io.to('admin_notifications').emit('notification_received', {
            message: `${data.employeeName || 'An employee'} has submitted their IPCRF for review.`,
            type: 'pm_submission',
            employeeName: data.employeeName
        });
        io.emit('commitment:submitted', data);
        io.emit('performance_update', { type: 'ipcrf_submitted', ...data });
    });

    socket.on('performance_update', (data) => {
        io.emit('performance_update', data);
        io.to('admin_notifications').emit('performance_update', data);
        if (data && data.employee_id) {
            io.to(String(data.employee_id)).emit('performance_update', data);
        }
    });

    socket.on('commitment:submitted', (data) => {
        io.emit('commitment:submitted', data);
        io.to('admin_notifications').emit('commitment:submitted', data);
    });

    socket.on('commitment:approved', (data) => {
        io.emit('commitment:approved', data);
        io.to('admin_notifications').emit('commitment:approved', data);
        if (data && data.employee_id) {
            io.to(String(data.employee_id)).emit('commitment:approved', data);
            io.to(String(data.employee_id)).emit('ipcrf:status_changed', { newStatus: 'finalized' });
        }
    });

    socket.on('commitment:returned', (data) => {
        io.emit('commitment:returned', data);
        io.to('admin_notifications').emit('commitment:returned', data);
        if (data && data.employee_id) {
            io.to(String(data.employee_id)).emit('commitment:returned', data);
            io.to(String(data.employee_id)).emit('ipcrf:status_changed', { newStatus: 'needs_revision' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from Socket');
    });
});

// --- 6. START SERVER ---
const { init } = require('./initDb');
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`🚀 Server flying on http://localhost:${PORT}`);
    console.log(`📂 Uploads directory: ${path.join(__dirname, 'uploads')}`);
    try {
        await init();
    } catch (err) {
        console.error("Failed to auto-initialize database:", err);
    }
});