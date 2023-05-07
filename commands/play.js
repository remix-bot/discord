const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: "play",
    description: "Plays a song",
    options: [
        {
            name: "song",
            description: "idk",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "Name of the song, video link, or Spotify",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
    ],
    voiceChannel: true,
    run: async (client, interaction) => {
        try {
            let stp = interaction.options.getSubcommand()

            if (stp === "song") {
                const name = interaction.options.getString('name')
                if (!name) return interaction.reply({ content: 'Must have a link or name to search.', ephemeral: true }).catch(e => { })

                await interaction.reply({ content: `The music was added correctly.`, ephemeral: true }).catch(e => { })
                try {
                    await client.player.play(interaction.member.voice.channel, name, {
                        member: interaction.member,
                        textChannel: interaction.channel,
                        interaction
                    })
                } catch (e) {
                    //console.log(e)
                    await interaction.editReply({ content: 'An error occurred, error 1', ephemeral: true }).catch(e => { })
                }
            }
        } catch (e) {
            //console.log(e)
            return interaction.editReply({ content: `An error occurred, error 2`, ephemeral: true }).catch(e => { })
        }
    },
};