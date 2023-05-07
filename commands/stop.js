const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Stop the music',
  inVoiceChannel: true,
  run: async (client, interaction) => {
    const queue = client.player.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
    queue.stop()
    const embed = new EmbedBuilder()
      .setDescription(`Stopped!`)
      .setColor("#e9196c")
    interaction.reply({ embeds: [embed] });
  }
}