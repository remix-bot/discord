const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'seek',
  description: 'Seek the Playlist!',
  inVoiceChannel: true,
  options: [{
    name: "position",
    description: "The position to set",
    type: ApplicationCommandOptionType.String,
    required: true
  }],
  run: async (client, interaction) => {
    const queue = client.player.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
    const time = getSeconds(interaction.options.getString("position"))
    if (isNaN(time)) return interaction.channel.send(`Please enter a valid number!`)
    queue.seek(time)
    const embed = new EmbedBuilder()
      .setDescription(`Seeked to ${time}!`)
      .setColor("#e9196c")
    interaction.reply({ embeds: [embed] });
  }
}

function getSeconds(str) {
  var p = str.split(':')
  var s = 0
  var m = 1
  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }
  return s;
}