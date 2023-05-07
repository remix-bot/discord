const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'volume',
  description: 'Set the volume',
  inVoiceChannel: true,
  options: [
    {
      name: 'volume',
      description: 'The volume which you want to set',
      type: ApplicationCommandOptionType.Number,
      required: true,
      min_value: 0,
      max_value: 100,
    },
  ],
  run: async (client, interaction) => {
    const queue = client.player.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
    const volume = interaction.options.getNumber('volume', true);
    if (isNaN(volume)) return interaction.channel.send(`Please enter a valid number!`)
    queue.setVolume(volume)
    const embed = new EmbedBuilder()
      .setDescription(`Volume set to \`${volume}\``)
      .setColor("#e9196c")
    interaction.reply({ embeds: [embed] });
  }
}