module.exports = {
    name: 'shuffle',
    description: 'Shuffles the playlist',
    voiceChannel: true,
    run: async (client, interaction) => {
        try {
            const queue = client.player.getQueue(interaction.guildId);
            if (!queue) return interaction.reply({ content: 'There is no queue playing', ephemeral: true }).catch(e => { })

            await queue.shuffle()
            interaction.reply({ content: 'The queue was shuffled' })
        } catch (e) {
            console.log(e)
            return interaction.reply({ content: `An error occurred, check console, shuffle 1`, ephemeral: true }).catch(e => { })
        }
    }
}
