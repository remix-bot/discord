const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: "skip",
    description: "Skip the current song",
    options: [
        {
            name: "amount",
            description: "Skip a number of songs",
            type: ApplicationCommandOptionType.Number,
            required: false
        }
    ],
    voiceChannel: true,
    run: async (client, interaction) => {
        try {
            const queue = client.player.getQueue(interaction.guildId);
            if (!queue || !queue.playing) return interaction.reply({ content: "Nothing is playing", ephemeral: true }).catch(e => { })

            let number = interaction.options.getNumber('amount')
            if (number) {
                if (!queue.songs.length > number) return interaction.reply({ content: "Nothing to skip", ephemeral: true }).catch(e => { })
                if (isNaN(number)) return interaction.reply({ content: "Not a valid number", ephemeral: true }).catch(e => { })
                if (1 > number) return interaction.reply({ content: "Not a valid number", ephemeral: true }).catch(e => { })

                try {
                    let old = queue.songs[0]
                    await client.player.jump(interaction, number).then(song => {
                        const embed = new EmbedBuilder()
                            .setDescription(`Skipping to song ${old.name}`)
                            .setColor("#e9196c")
                        interaction.reply({ embeds: [embed] });
                    })
                } catch (e) {
                    //console.log(e)
                    return interaction.reply({ content: `An error occurred, check console, skip 1` }).catch(e => { })
                }
            } else {
                try {
                    let old = queue.songs[0]
                    const success = await queue.skip()
                    const embed = new EmbedBuilder()
                        .setDescription({ content: success ? `Skipping to song: **${old.name}**` : 'Skipped song' })
                        .setColor("#e9196c")
                    interaction.reply({ embeds: [embed] });
                } catch (e) {
                    //console.log(e)
                    return interaction.reply({ content: `No more songs to skip.`, ephemeral: true }).catch(e => { })
                }
            }
        } catch (e) {
            //console.log(e)
            return interaction.reply({ content: `An error occurred, check console, skip 3`, ephemeral: true }).catch(e => { })
        }
    },
};
