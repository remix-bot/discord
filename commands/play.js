const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music from Spotify (track, album, or playlist)")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("The Spotify track, album, or playlist URL")
        .setRequired(true))
};
