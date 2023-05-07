const { EmbedBuilder } = require('discord.js');

module.exports = async (client, queue, song) => {
  if (queue) {
    if (queue.repeatMode !== 0) return;
    if (queue.textChannel) {
      const embed = new EmbedBuilder()
        .setColor('#e9196c')
        .setDescription(`🎵 Playing: **${song.name}**`);
      queue.textChannel.send({ embeds: [embed] }).catch(console.error);
    }
  }
}
