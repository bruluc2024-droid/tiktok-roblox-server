const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const app = express();

const TIKTOK_USERNAME = 'spawnistic_';

const eventQueue = [];
const commentHistory = {}; // tracks last roblox username per tiktok user

const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

tiktok.connect()
    .then(() => console.log('Connected to TikTok LIVE!'))
    .catch(err => console.error('Failed to connect:', err.message));

// Comment - check if it's a Roblox username spawn or just track it
tiktok.on('chat', data => {
    const msg = data.comment.trim();
    const tiktokUser = data.uniqueId;

    // Store latest comment as their roblox username
    commentHistory[tiktokUser] = msg;

    // Trigger username spawn
    eventQueue.push({ type: 'comment', username: tiktokUser, message: msg });
});

// Follow - spawn a zombie
tiktok.on('follow', data => {
    eventQueue.push({ type: 'follow', username: data.uniqueId });
});

// Like - every 10 likes spawn a zombie
tiktok.on('like', data => {
    eventQueue.push({ type: 'like', username: data.uniqueId, count: data.likeCount });
});

// Gift handler
tiktok.on('gift', data => {
    const gift = data.giftName.toLowerCase();
    const tiktokUser = data.uniqueId;
    const robloxUsername = commentHistory[tiktokUser] || null;

    if (gift === 'rosa') {
        // Speedy Zombie
        eventQueue.push({ type: 'gift_rosa', username: tiktokUser });

    } else if (gift === 'gold boxing glove') {
        // Spawn username model with 250 health
        eventQueue.push({ type: 'gift_boxing_glove', username: tiktokUser, robloxUsername: robloxUsername });

    } else if (gift === 'hat and mustache') {
        // Spawn 5 Giant Zombies
        eventQueue.push({ type: 'gift_hat_mustache', username: tiktokUser });

    } else if (gift === 'super gg') {
        // Giant Username Model using their comment history roblox username
        eventQueue.push({ type: 'gift_super_gg', username: tiktokUser, robloxUsername: robloxUsername });
    }
});

// Roblox polls this
app.get('/events', (req, res) => {
    const events = [...eventQueue];
    eventQueue.length = 0;
    res.json(events);
});

app.get('/', (req, res) => res.send('TikTok Roblox Server running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
