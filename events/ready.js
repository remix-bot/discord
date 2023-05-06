module.exports = async (client, config) => {
    client.config = require('./config.json')
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v10');

    const rest = new REST({ version: '10' }).setToken(config.token);

    (async () => {
        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: client.commands });
        } catch (err) {
            console.log(err)
        }
    })();

    console.log(`Connected as ${client.user.username}`)
}
