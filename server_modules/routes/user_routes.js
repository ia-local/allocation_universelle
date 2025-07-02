// server_modules/routes/user_routes.js
const express = require('express');
const router = express.Router();
const { logApiCall } = require('../utils/api_logger');

router.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    logApiCall('user_routes.js', 'POST /register', 'info', { username, email });

    if (!username || !password || !email) {
        logApiCall('user_routes.js', 'POST /register', 'warn', { message: 'Missing registration data', data: req.body }, 400);
        return res.status(400).json({ message: 'Missing username, password, or email' });
    }

    const userId = `user_${Date.now()}`;
    logApiCall('user_routes.js', 'POST /register', 'success', { userId }, 201);
    res.status(201).json({ message: 'User registered successfully', userId });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    logApiCall('user_routes.js', 'POST /login', 'info', { username });

    if (!username || !password) {
        logApiCall('user_routes.js', 'POST /login', 'warn', { message: 'Missing login data', data: req.body }, 400);
        return res.status(400).json({ message: 'Missing username or password' });
    }

    if (username === "testuser" && password === "password123") {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0X3VzZXIiLCJpYXQiOjE2NzgwMDgwMDB9.signature";
        logApiCall('user_routes.js', 'POST /login', 'success', { userId: "test_user" }, 200);
        res.status(200).json({ message: 'Login successful', token, userId: "test_user" });
    } else {
        logApiCall('user_routes.js', 'POST /login', 'warn', { message: 'Invalid credentials' }, 401);
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

module.exports = router;