module.exports = {
    name: 'stop',
    description: 'Stop the music',
    inVoiceChannel: true,
    run: async (client, interaction) => {
      const queue = client.player.getQueue(interaction.guildId);
      if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
      queue.stop()
      interaction.channel.send(`Stopped!`)
    }
  }