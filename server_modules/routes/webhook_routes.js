// server_modules/routes/webhook_routes.js
const express = require('express');
const router = express.Router();
const { logApiCall } = require('../utils/api_logger');

router.post('/github', (req, res) => {
    const githubEvent = req.headers['x-github-event'];
    const payload = req.body;

    logApiCall('webhook_routes.js', 'POST /github', 'info', { event: githubEvent, payload: 'Received GitHub webhook' });

    if (!payload || Object.keys(payload).length === 0) {
        logApiCall('webhook_routes.js', 'POST /github', 'warn', { message: 'Empty or invalid GitHub webhook payload' }, 400);
        return res.status(400).json({ message: 'Empty or invalid GitHub webhook payload' });
    }

    if (githubEvent === 'push') {
        logApiCall('webhook_routes.js', 'POST /github', 'info', { message: `Push event on repository ${payload.repository.full_name} by ${payload.pusher.name}` });
    } else if (githubEvent === 'pull_request') {
        logApiCall('webhook_routes.js', 'POST /github', 'info', { message: `Pull Request event #${payload.number} on repository ${payload.repository.full_name}` });
    }

    logApiCall('webhook_routes.js', 'POST /github', 'success', { message: 'GitHub webhook received', eventType: githubEvent }, 200);
    res.status(200).json({ message: 'GitHub webhook received', eventType: githubEvent });
});

router.post('/stripe', (req, res) => {
    const event = req.body;

    logApiCall('webhook_routes.js', 'POST /stripe', 'info', { eventType: event.type, eventId: event.id, data: 'Received Stripe webhook' });

    if (!event || !event.type) {
        logApiCall('webhook_routes.js', 'POST /stripe', 'warn', { message: 'Empty or invalid Stripe webhook event' }, 400);
        return res.status(400).json({ message: 'Empty or invalid Stripe webhook event' });
    }

    switch (event.type) {
        case 'charge.succeeded':
            logApiCall('webhook_routes.js', 'POST /stripe', 'info', { message: `Charge succeeded for amount ${event.data.object.amount} ${event.data.object.currency}` });
            break;
        case 'customer.subscription.created':
            logApiCall('webhook_routes.js', 'POST /stripe', 'info', { message: `New subscription created for customer ${event.data.object.customer}` });
            break;
        case 'payment_intent.succeeded':
            logApiCall('webhook_routes.js', 'POST /stripe', 'info', { message: `Payment intent succeeded: ${event.data.object.id}` });
            break;
        default:
            logApiCall('webhook_routes.js', 'POST /stripe', 'info', { message: `Unhandled event type ${event.type}` });
    }

    logApiCall('webhook_routes.js', 'POST /stripe', 'success', { message: 'Stripe webhook received', eventType: event.type }, 200);
    res.status(200).json({ message: 'Stripe webhook received', eventType: event.type });
});

module.exports = router;