const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  description: 'nowplaying the playlist',
  voiceChannel: true,
  run: async (client, interaction) => {
    const queue = client.player.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
    const song = queue.songs[0]
    const embed = new EmbedBuilder()
      .setDescription(`I'm playing **\`${song.name}\`**, by ${song.user}`)
      .setThumbnail(song.thumbnail)
      .setColor("#e9196c")
    interaction.reply({ embeds: [embed] });
  }
}