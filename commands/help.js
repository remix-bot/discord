const { InteractionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'Show all available commands',
    userPrams: [],
    botPrams: ['EMBED_LINKS'],
    run: async (client, interaction) => {
        try {
            if (interaction?.type === InteractionType.ApplicationCommand) {
                if (interaction.commandName === 'help') {
                    const commands = await getCommands();
                    const embed = new EmbedBuilder()
                        .setColor('#e9196c')
                        .setTitle('Available commands')
                        .setDescription(commands.join('\n'));

                    return interaction?.reply({ embeds: [embed], ephemeral: false });
                } else {
                    const command = await getCommand(interaction.commandName);
                    if (command) {
                        try {
                            return command.run(client, interaction);
                        } catch (e) {
                            console.log(e);
                            return interaction?.reply({ content: `Error 1`, ephemeral: true });
                        }
                    } else {
                        return interaction?.reply({ content: 'Command not found.', ephemeral: true });
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    },
}

async function getCommands() {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    const commands = [];

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(`/${command.name} - ${command.description}`);
    }

    return commands;
}

async function getCommand(commandName) {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        if (commandName === command.name) {
            return command;
        }
    }

    return null;
}