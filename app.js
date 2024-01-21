const WebSocket = require('ws');
const axios = require('axios');
const config = require('./config');

const gameIds = Object.keys(config.gameMappings); // Dynamically generate game IDs

gameIds.forEach(gameId => {
    const url = `wss://awbw.amarriner.com/node/game/${gameId}`;
    connectWebSocket(url, gameId);
});

function connectWebSocket(url, gameId) {
    const ws = new WebSocket(url, {
        headers: {
            'Cookie': 'PHPSESSID=cf4fd056b9482bf008d0ae5f0018a128', // Can be any MD5 string this is the md5 hash for 'awbw'
        }
    });

    let pingInterval;

    ws.on('open', () => {
        console.log(`Connected to WebSocket at ${url}`);
        // Send a ping every 45 seconds
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 45000);
    });

    ws.on('pong', () => {
        console.log('Received pong from server');
    });

    ws.on('message', (data) => {
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }

        try {
            const message = JSON.parse(data);
            let topLevelKey = Object.keys(message)[0];
            console.log("Received message:", topLevelKey);
            if (isTargetMessage(message)) {
                notifySlack(message, gameId);
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`WebSocket closed at ${url}. Code: ${code}, Reason: ${reason}`);
        clearInterval(pingInterval); // Clear the ping interval
        if (code === 1000) {
            // Normal closure
            if (shouldReconnect(reason)) {
                console.log('Attempting to reconnect (normal closure)...');
                setTimeout(() => connectWebSocket(url, gameId), 3000); // Reconnect after 3 seconds
            }
        } else {
            // Abnormal closure, likely need to reconnect
            console.log('Attempting to reconnect (abnormal closure)...');
            setTimeout(() => connectWebSocket(url, gameId), 10000); // Reconnect after 10 seconds
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error at ${url}:`, error);
    });
}

function shouldReconnect(reason) {
    if (!reason) return true;
    try {
        const reasonObj = JSON.parse(reason);
        return reasonObj.reconnect === true;
    } catch (error) {
        return false;
    }
}

function isTargetMessage(message) {
    return message.NextTurn && message.NextTurn.action === 'NextTurn';
}

function notifySlack(message, gameId) {
    const gameMapping = config.gameMappings[gameId];
    if (!gameMapping) {
        console.error(`No mapping found for game ID: ${gameId}`);
        return;
    }

    const gameUsername = gameMapping[message.NextTurn.nextPId];
    if (!gameUsername) {
        console.error(`No username found for player ID: ${message.NextTurn.nextPId}`);
        return;
    }

    const slackEmail = config.userMapping[gameUsername];
    if (!slackEmail) {
        console.error(`No Slack email found for username: ${gameUsername}`);
        return;
    }

    const slackMessage = {
        user: slackEmail, message: `it's your turn! https://awbw.amarriner.com/game.php?games_id=${gameId}`,
    };

    console.log(slackMessage);

    axios.post(config.slackWebhookUrl, slackMessage)
        .then(response => {
            console.log('Message sent to Slack', response.data);
        })
        .catch(error => {
            console.error('Error sending message to Slack', error);
        });
}
