const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const app = express();

const TIKTOK_USERNAME = 'spawnistic_';

const eventQueue = [];
const commentHistory = {};

// Start HTTP server FIRST before anything else
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/events', (req, res) => {
    const events = [...eventQueue];
    eventQueue.length = 0;
    res.json(events);
});

app.get('/', (req, res) => res.send('TikTok Roblox Server running! ✅'));

// TikTok connection - won't crash server if it fails
const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

function connectTikTok() {
    tiktok.connect()
        .then(() => console.log('✅ Connected to TikTok LIVE!'))
        .catch(err => {
            console.log('⚠️ TikTok not live yet, retrying in 30 seconds...');
            setTimeout(connectTikTok, 30000);
        });
}

connectTikTok();

tiktok.on('chat', data => {
    const msg = data.comment.trim();
    const tiktokUser = data.uniqueId;
    commentHistory[tiktokUser] = msg;
    eventQueue.push({ type: 'comment', username: tiktokUser, message: msg });
});

tiktok.on('follow', data => {
    eventQueue.push({ type: 'follow', username: data.uniqueId });
});

tiktok.on('like', data => {
    eventQueue.push({ type: 'like', username: data.uniqueId, count: data.likeCount });
});

tiktok.on('gift', data => {
    const gift = data.giftName.toLowerCase().trim();
    const tiktokUser = data.uniqueId;
    const robloxUsername = commentHistory[tiktokUser] || null;

    console.log(`🎁 Gift: "${gift}" from ${tiktokUser}`);

    if (gift === 'rosa') {
        eventQueue.push({ type: 'gift_rosa', username: tiktokUser });
    } else if (gift === 'gold boxing glove') {
        eventQueue.push({ type: 'gift_boxing_glove', username: tiktokUser, robloxUsername: robloxUsername });
    } else if (gift === 'hat and mustache') {
        eventQueue.push({ type: 'gift_hat_mustache', username: tiktokUser });
    } else if (gift === 'super gg') {
        eventQueue.push({ type: 'gift_super_gg', username: tiktokUser, robloxUsername: robloxUsername });
    }
});
