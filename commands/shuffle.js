const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'shuffle',
    description: 'Shuffles the playlist',
    voiceChannel: true,
    run: async (client, interaction) => {
        try {
            const queue = client.player.getQueue(interaction.guildId);
            if (!queue) return interaction.reply({ content: 'There is no queue playing', ephemeral: true }).catch(e => { })

            await queue.shuffle()
            const embed = new EmbedBuilder()
                .setDescription(`The queue was shuffled`)
                .setThumbnail(song.thumbnail)
                .setColor("#e9196c")
            interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.log(e)
            return interaction.reply({ content: `An error occurred, check console, shuffle 1`, ephemeral: true }).catch(e => { })
        }
    }
}
