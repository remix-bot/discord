const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music from Spotify, YouTube, or search by name")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name, Spotify URL, or YouTube URL")
        .setRequired(true))
};
