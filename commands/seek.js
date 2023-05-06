const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'seek',
    description: 'Seek the Playlist!',
    inVoiceChannel: true,
    options: [
        {
          name: 'seek',
          description: 'Seek which you want to set',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
      ],
    run: async (client, interaction) => {
      const queue = client.player.getQueue(interaction.guildId);
      if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true })
      const time = interaction.options.getNumber('time', true);
      if (isNaN(time)) return interaction.channel.send(`Please enter a valid number!`)
      queue.seek(time)
      interaction.channel.send(`Seeked to ${time}!`)
    }
  }