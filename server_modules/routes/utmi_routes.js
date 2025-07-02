// server_modules/routes/utmi_routes.js
const express = require('express');
const router = express.Router();
const { logApiCall } = require('../utils/api_logger');

router.post('/mint', (req, res) => {
    const { userId, amount, reason } = req.body;
    logApiCall('utmi_routes.js', 'POST /mint', 'info', { userId, amount, reason });

    if (!userId || typeof amount !== 'number' || amount <= 0 || !reason) {
        logApiCall('utmi_routes.js', 'POST /mint', 'warn', { message: 'Invalid minting data', data: req.body }, 400);
        return res.status(400).json({ message: 'Invalid minting data' });
    }

    const newBalance = (Math.random() * 1000 + 100).toFixed(2);
    logApiCall('utmi_routes.js', 'POST /mint', 'success', { userId, amount, reason, newBalance }, 200);
    res.status(200).json({ message: 'UTMi minted successfully', newBalance: parseFloat(newBalance) });
});

router.post('/burn', (req, res) => {
    const { userId, amount, reason } = req.body;
    logApiCall('utmi_routes.js', 'POST /burn', 'info', { userId, amount, reason });

    if (!userId || typeof amount !== 'number' || amount <= 0 || !reason) {
        logApiCall('utmi_routes.js', 'POST /burn', 'warn', { message: 'Invalid burning data', data: req.body }, 400);
        return res.status(400).json({ message: 'Invalid burning data' });
    }

    const newBalance = (Math.random() * 900 + 50).toFixed(2);
    logApiCall('utmi_routes.js', 'POST /burn', 'success', { userId, amount, reason, newBalance }, 200);
    res.status(200).json({ message: 'UTMi burned successfully', newBalance: parseFloat(newBalance) });
});

router.get('/history', (req, res) => {
    const { userId, limit } = req.query;
    logApiCall('utmi_routes.js', 'GET /history', 'info', { userId, limit });

    const history = [
        { transactionId: 'txn_001', type: 'mint', userId: 'user123', amount: 100.50, timestamp: '2023-01-15T10:30:00Z', description: 'Initial allocation' },
        { transactionId: 'txn_002', type: 'transfer', userId: 'user123', amount: -20.00, toUserId: 'user456', timestamp: '2023-01-16T11:00:00Z', description: 'Payment for service' },
        { transactionId: 'txn_003', type: 'burn', userId: 'user123', amount: -5.00, timestamp: '2023-01-17T14:15:00Z', description: 'Penalty for late submission' },
        { transactionId: 'txn_004', type: 'mint', userId: 'user789', amount: 50.00, timestamp: '2023-01-18T09:00:00Z', description: 'Monthly reward' }
    ];

    let filteredHistory = history;
    if (userId) {
        filteredHistory = history.filter(item => item.userId === userId || item.toUserId === userId);
    }
    if (limit) {
        filteredHistory = filteredHistory.slice(0, parseInt(limit));
    }

    logApiCall('utmi_routes.js', 'GET /history', 'success', { count: filteredHistory.length }, 200);
    res.status(200).json(filteredHistory);
});

module.exports = router;