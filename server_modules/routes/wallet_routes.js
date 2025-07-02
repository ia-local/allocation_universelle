// server_modules/routes/wallet_routes.js
const express = require('express');
const router = express.Router();
const { logApiCall } = require('../utils/api_logger');

router.get('/balance', (req, res) => {
    const { userId } = req.query;
    logApiCall('wallet_routes.js', 'GET /balance', 'info', { userId });

    if (!userId) {
        logApiCall('wallet_routes.js', 'GET /balance', 'warn', { message: 'Missing userId parameter' }, 400);
        return res.status(400).json({ message: 'Missing userId parameter' });
    }

    const totalBalance = (Math.random() * 2000 + 500).toFixed(2);
    const availableBalance = (parseFloat(totalBalance) * 0.8).toFixed(2);
    const pendingBalance = (parseFloat(totalBalance) * 0.2).toFixed(2);

    logApiCall('wallet_routes.js', 'GET /balance', 'success', { userId, totalBalance, availableBalance, pendingBalance }, 200);
    res.status(200).json({
        userId,
        totalBalance: parseFloat(totalBalance),
        availableBalance: parseFloat(availableBalance),
        pendingBalance: parseFloat(pendingBalance),
    });
});

router.post('/claim-utmi', (req, res) => {
    const { userId, amount } = req.body;
    logApiCall('wallet_routes.js', 'POST /claim-utmi', 'info', { userId, amount });

    if (!userId || typeof amount !== 'number' || amount <= 0) {
        logApiCall('wallet_routes.js', 'POST /claim-utmi', 'warn', { message: 'Invalid claim data', data: req.body }, 400);
        return res.status(400).json({ message: 'Invalid claim data' });
    }

    const newAvailableBalance = (Math.random() * 1500 + 500).toFixed(2);
    const newPendingBalance = (Math.random() * 200).toFixed(2);

    logApiCall('wallet_routes.js', 'POST /claim-utmi', 'success', { userId, amount, newAvailableBalance, newPendingBalance }, 200);
    res.status(200).json({
        message: 'UTMi claimed successfully',
        newAvailableBalance: parseFloat(newAvailableBalance),
        newPendingBalance: parseFloat(newPendingBalance),
    });
});

router.post('/transfer', (req, res) => {
    const { senderId, receiverId, amount, description } = req.body;
    logApiCall('wallet_routes.js', 'POST /transfer', 'info', { senderId, receiverId, amount, description });

    if (!senderId || !receiverId || typeof amount !== 'number' || amount <= 0) {
        logApiCall('wallet_routes.js', 'POST /transfer', 'warn', { message: 'Invalid transfer data', data: req.body }, 400);
        return res.status(400).json({ message: 'Invalid transfer data' });
    }

    const senderNewBalance = (Math.random() * 1000 + 100).toFixed(2);
    const receiverNewBalance = (Math.random() * 1000 + 500).toFixed(2);

    logApiCall('wallet_routes.js', 'POST /transfer', 'success', { senderId, receiverId, amount, senderNewBalance, receiverNewBalance }, 200);
    res.status(200).json({
        message: 'UTMi transferred successfully',
        senderNewBalance: parseFloat(senderNewBalance),
        receiverNewBalance: parseFloat(receiverNewBalance),
    });
});

router.post('/convert', (req, res) => {
    const { userId, amount, targetCurrency } = req.body;
    logApiCall('wallet_routes.js', 'POST /convert', 'info', { userId, amount, targetCurrency });

    if (!userId || typeof amount !== 'number' || amount <= 0 || !targetCurrency) {
        logApiCall('wallet_routes.js', 'POST /convert', 'warn', { message: 'Invalid conversion data', data: req.body }, 400);
        return res.status(400).json({ message: 'Invalid conversion data' });
    }

    const utmiNewBalance = (Math.random() * 900 + 50).toFixed(2);
    const convertedAmount = (amount * (Math.random() * 5 + 1)).toFixed(2);

    logApiCall('wallet_routes.js', 'POST /convert', 'success', { userId, amount, targetCurrency, utmiNewBalance, convertedAmount }, 200);
    res.status(200).json({
        message: 'UTMi converted successfully',
        utmiNewBalance: parseFloat(utmiNewBalance),
        convertedAmount: parseFloat(convertedAmount),
        targetCurrency,
    });
});

module.exports = router;