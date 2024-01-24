module.exports = {
    slackWebhookUrl: 'https://hooks.slack.com/triggers/EXAMPLE/EXAMPLE/EXAMPLE',

    // Global user to slack email mappings, has to be done manually
    userMapping: {
        'userA': 'userA@example.com',
        'userB': 'userB@example.com',
        'userC': 'userC@example.com',
        'userD': 'userD@example.com',
    },

    // Game specific ID to username mapping, snippet in readme to autogenerate
    gameMappings: {
        '123456': {
            "name": "game1",
            "playerId1": "userA",
            "playerId2": "userB",
            "playerId3": "userC",
            "playerId4": "userD"
        },
        // More games can be added here
    },
};