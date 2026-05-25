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

setTimeout(() => {
    try {
        const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');
        const TIKTOK_USERNAME = 'spawnistic';
        const tiktok = new TikTokLiveConnection(TIKTOK_USERNAME);

        function connectTikTok() {
            console.log('Attempting to connect to TikTok LIVE...');
            tiktok.connect()
                .then(() => console.log('Connected to TikTok LIVE!'))
                .catch(err => {
                    console.log('Failed: ' + err.message + ' | Retrying in 30s...');
                    setTimeout(connectTikTok, 30000);
                });
        }

        connectTikTok();

        tiktok.on(WebcastEvent.CHAT, data => {
            const msg = data.comment.trim();
            const tiktokUser = data.user.uniqueId;
            console.log(`Comment: ${tiktokUser}: ${msg}`);
            commentHistory[tiktokUser] = msg;
            eventQueue.push({ type: 'comment', username: tiktokUser, message: msg });
        });

        tiktok.on(WebcastEvent.FOLLOW, data => {
            const tiktokUser = data.user.uniqueId;
            console.log(`Follow: ${tiktokUser}`);
            eventQueue.push({ type: 'follow', username: tiktokUser });
        });

        tiktok.on(WebcastEvent.LIKE, data => {
            const tiktokUser = data.user.uniqueId;
            console.log(`Like: ${tiktokUser}`);
            eventQueue.push({ type: 'like', username: tiktokUser, count: data.likeCount });
        });

        tiktok.on(WebcastEvent.GIFT, data => {
            const gift = data.giftName.toLowerCase().trim();
            const tiktokUser = data.user.uniqueId;
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
