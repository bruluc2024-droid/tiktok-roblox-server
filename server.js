process.on('uncaughtException', err => {
    console.log('Caught error: ' + err.message);
});

const express = require('express');
const app = express();

const eventQueue = [];
const commentHistory = {};

app.get('/events', (req, res) => {
    const events = [...eventQueue];
    eventQueue.length = 0;
    res.json(events);
});

app.get('/', (req, res) => res.send('TikTok Roblox Server running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Load TikTok AFTER server is running
setTimeout(() => {
    try {
        const { WebcastPushConnection } = require('tiktok-live-connector');
        const TIKTOK_USERNAME = 'spawnistic_';
        const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

        function connectTikTok() {
            tiktok.connect()
                .then(() => console.log('Connected to TikTok LIVE!'))
                .catch(err => {
                    console.log('Not live yet, retrying in 30 seconds...');
                    setTimeout(connectTikTok, 30000);
                });
        }

        connectTikTok();

        tiktok.on('chat', data => {
            const msg = data.comment.trim();
            commentHistory[data.uniqueId] = msg;
            eventQueue.push({ type: 'comment', username: data.uniqueId, message: msg });
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
            console.log(`Gift: "${gift}" from ${tiktokUser}`);

            if (gift === 'rosa') {
                eventQueue.push({ type: 'gift_rosa', username: tiktokUser });
            } else if (gift === 'gold boxing glove') {
                eventQueue.push({ type: 'gift_boxing_glove', username: tiktokUser, robloxUsername });
            } else if (gift === 'hat and mustache') {
                eventQueue.push({ type: 'gift_hat_mustache', username: tiktokUser });
            } else if (gift === 'super gg') {
                eventQueue.push({ type: 'gift_super_gg', username: tiktokUser, robloxUsername });
            }
        });

    } catch(e) {
        console.log('TikTok module error: ' + e.message);
    }
}, 1000);
