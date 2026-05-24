const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const app = express();

const TIKTOK_USERNAME = 'your_tiktok_username';

const eventQueue = [];

const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

tiktok.connect()
    .then(() => console.log('Connected to TikTok LIVE!'))
    .catch(err => console.error('Failed to connect:', err.message));

tiktok.on('follow', data => {
    eventQueue.push({ type: 'follow', username: data.uniqueId });
});

tiktok.on('like', data => {
    eventQueue.push({ type: 'like', username: data.uniqueId, count: data.likeCount });
});

tiktok.on('chat', data => {
    eventQueue.push({ type: 'comment', username: data.uniqueId, message: data.comment });
});

tiktok.on('gift', data => {
    eventQueue.push({ type: 'gift', username: data.uniqueId, gift: data.giftName });
});

app.get('/events', (req, res) => {
    const events = [...eventQueue];
    eventQueue.length = 0;
    res.json(events);
});

app.get('/', (req, res) => res.send('TikTok Roblox Server running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
