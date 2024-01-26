const axios = require("axios");
const config = require("./config");

function test(message) {
    axios.post(config.slackWebhookUrl, message)
        .then(response => {
            console.log('Message sent to Slack', response.data);
        })
        .catch(error => {
            console.error('Error sending message to Slack', error);
        });
}

test({
    user: "test@example.com", gameName: `Some Game`,
    link: `https://awbw.amarriner.com/game.php?games_id=123456`,
});