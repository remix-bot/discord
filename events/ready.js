const { ActivityType } = require('discord.js');

module.exports = async (client) => {
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v10');

    const rest = new REST({ version: '10' }).setToken('ur token');

    (async () => {
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: client.commands });
        } catch (err) {
            console.log(err)
        }
    })();

    client.user.setPresence({
        activities: [{ name: `/help`, type: ActivityType.Listening }],
    });

    console.log(`Connected as ${client.user.username}`)
}
