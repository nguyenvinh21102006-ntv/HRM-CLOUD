require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');  // PHẢI CÓ DÒNG NÀY

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(cors({ origin: ['http://127.0.0.1:8080', 'http://localhost:8080'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Session
if (!process.env.SESSION_SECRET) {
    console.error('❌ SESSION_SECRET missing in .env');
    process.exit(1);
}
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'hrm_session_id',
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' }
}));

// Kết nối database và tạo tài khoản
connectDB();  // PHẢI CÓ DÒNG NÀY

// Routes
app.use('/api', require('./routes/api'));

// Static files
app.use(express.static(path.join(__dirname, '../Front-End')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-End/index.html'));
});

// Error handling
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});