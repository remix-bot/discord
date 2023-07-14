const fs = require('fs');
const os = require('os');
let cpuStat = require("cpu-stat");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Collection, EmbedBuilder, GatewayIntentBits, ActivityType, version } = require('discord.js');
const configFile = (process.argv[2]) ? process.argv[2] : './config.json';
const { token, clientId, guildIds } = require(configFile); const config = require(configFile);
const MusicPlayer = require("./discord-player.js");

const client = new Client({
        shards: "auto",
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent
	],
	disableMentions: 'everyone',
});

client.commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

var DATA = {
	queue: [],
	loop: false,
	loopSong: false,
	volume: 1,
	current: null, // {id: "", title: ""}
	guildId: null,
	speech: false,
	status: "Idle"
};

var players = new Map();

async function buildSlashCommands() {
    const commands = [];
    client.commands.forEach(command => {
      commands.push(command.data.toJSON());
    });
  
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: commands,
      });
      console.log('Successfully registered slash commands globally!');
    } catch (error) {
      console.error('Error while registering slash commands globally:', error);
    }
  }

// Event: Ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    updateStatus();
    // Build and register slash commands globally on bot startup
    await buildSlashCommands();
  });

// Event: Interaction Create
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
  
    try {
      await execute(interaction.commandName, interaction);
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  });

function updateStatus() {
  const statuses = [
    { name: '/help - The best high quality music bot.' },
    { name: '/play - The best high quality music bot.' }
  ];

  let currentIndex = 0;

  setInterval(() => {
    const status = statuses[currentIndex];
    client.user.setPresence({
      activities: [{ name: status.name, type: ActivityType.LISTENING }],
    });

    currentIndex = (currentIndex + 1) % statuses.length;
  }, 300000); // 5 minutes in milliseconds

  // You can also add initial status here if needed
}
  
function createEmbed(description, color) {
	const embed = new EmbedBuilder()
	  .setDescription(description)
	  .setColor(color)
	  .setTimestamp();
	return embed;
  }

async function execute(name, interaction) {
	if (!players.has(interaction.guildId)) {
		const musicPlayer = new MusicPlayer(client, configFile, DATA);
		//musicPlayer.on("log", text => console.log("[" + interaction.guildId + "][Music Player][Log] " + text));
		//musicPlayer.on("error", error => console.error("[" + interaction.guildId + "][Music Player][Error] " + error));
		//musicPlayer.on("state", state => console.log("[" + interaction.guildId + "][Music Player][State Update] " + state));
		players.set(interaction.guildId, musicPlayer);
	}
	try {
		const musicPlayer = players.get(interaction.guildId);
		switch (name) {
			case "help":
                const helpEmbed = new EmbedBuilder()
                .setColor('#e9196c')
                .setTitle('Available commands\n__For support, join our server:__\nhttps://discord.gg/3YABbWRP7z')
                .setDescription(`/help - Show all available commands\n/clear-list - Clear the queue.\n/join - Will connect to your current voice channel.\n/leave - Leave the voice channel.\n/list- List the contents of the queue.\n/loop - Toggle the loop.\n/lyrics - Fetch the lyrics of the songs, that's playing at the moment.\n/np - Get the currently playing song.\n/pause - Pause the playback.\n/play - Will play some example music.\n/remove - Remove a specific item from the queue.\n/resume - Resume the playback.\n/shuffle - Shuffle the queue.\n/skip - Skip to the next song.\n/state - Sends a new message with the current state of the bot.\n/stats - Show stats bot.\n/toggle-speech - Enable/Disable the voice controls.`)
				.setThumbnail(client.user.displayAvatarURL());
                return interaction.reply({ embeds: [helpEmbed], ephemeral: false });
				break;
			case "join":
				await interaction.deferReply();
				let s = musicPlayer.join(interaction);
				if (!s) {
				const embed1 = createEmbed('Please join a voice channel first.', '#e9196c');
                interaction.editReply({ embeds: [embed1], ephemeral: true }); return; }
				const embed2 = createEmbed('Joined', '#e9196c');
                interaction.editReply({ embeds: [embed2] });
				break;
			case "leave":
				await interaction.deferReply();
				var left = musicPlayer.leave(interaction);
				if (left) {
					const embed3 = createEmbed('Left the voice channel.', '#e9196c');
                    return interaction.editReply({ embeds: [embed3] });
				}
				const embed4 = createEmbed("I'm not connected to a voice channel...", '#e9196c');
                return interaction.editReply({ embeds: [embed4], ephemeral: true });
				break;
			case "play":
				await musicPlayer.play(interaction);
				break;
			case "np":
				await musicPlayer.nowPlaying(interaction);
				break;
			case "pause":
				musicPlayer.pause();
				const embed5 = createEmbed('Paused.', '#e9196c');
                interaction.reply({ embeds: [embed5] });
				break;
			case "resume":
				musicPlayer.resume();
				const embed6 = createEmbed('Resumed.', '#e9196c');
                interaction.reply({ embeds: [embed6] });
				break;
			case "skip":
				musicPlayer.skip();
				const embed7 = createEmbed('Skipped.', '#e9196c');
                interaction.reply({ embeds: [embed7] });
				break;
			case "list":
				await musicPlayer.list(interaction);
				break;
			case "loop":
				musicPlayer.loop(interaction);
				break;
			case "remove":
				musicPlayer.remove(interaction);
				break;
			case "statemessage":
				musicPlayer.stateDisplay(interaction);
				break;
			case "shuffle":
				musicPlayer.shuffle(interaction);
				break;
			case "clear-list":
				musicPlayer.clear(interaction);
				break;
			case "stats":
				await interaction.deferReply({
				ephemeral: false,
				});
				let uptime = await os.uptime();
			  
				let d = Math.floor(uptime / (3600 * 24));
				let h = Math.floor(uptime % (3600 * 24) / 3600);
				let m = Math.floor(uptime % 3600 / 60);
				let sc = Math.floor(uptime % 60);
				let dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
				let hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
				let mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
				let sDisplay = sc > 0 ? sc + (sc === 1 ? " second" : " seconds") : "";
				let ccount = client.channels.cache.size;
				let scount = client.guilds.cache.size;
				let mcount = 0;
				client.guilds.cache.forEach((guild) => {
				mcount += guild.memberCount;
				});
				cpuStat.usagePercent(function (err, percent, seconds) {
			    if (err) {
				return //console.log(err);
				}
				const embed = new EmbedBuilder()
				.setDescription(`__**${client.user.username} Information**__`)
				.setThumbnail(client.user.displayAvatarURL())
				.addFields([
				{ name: "**Client**", value: `\`\`\`Servers: ${scount}\nChannels: ${ccount}\nUsers: ${mcount}\`\`\``, inline: false },
				{ name: "**CPU**", value: `\`\`\`Cpu: ${os.cpus().map((i) => `${i.model}`)[0]}\nLoad: ${percent.toFixed(2)}%\nPlatform: ${os.platform()}\`\`\``, inline: false },
				{ name: "**DISK**", value: `\`\`\`Disk Used: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} / ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB\`\`\``, inline: false },
				{ name: "**Discord**", value: `\`\`\`Discord.js: v${version}\nNode: ${process.version}\nAPI websocket ping: ${Math.round(client.ws.ping)}ms\`\`\``, inline: false },
				{ name: "**System**", value: `\`\`\`Uptime: ${dDisplay + hDisplay + mDisplay + sDisplay}\`\`\``, inline: true }
				])
				.setColor("#e9196c")
				.setTimestamp(Date.now());
				interaction.editReply({ embeds: [embed] });
				});
				break;
			case "toggle-speech":
				musicPlayer.toggleSpeech(interaction);
				break;
			case "lyrics":
				if (config.disableLyrics) { 
					const embed8 = createEmbed('This function is currently disabled :/.', '#e9196c');
                    interaction.reply({ embeds: [embed8], ephemeral: true  }); return; }
				musicPlayer.lyrics(interaction);
				break;
			default:

				break;
		}
	} catch (e) {
		//console.error("Error: ", e);
	}
}

client.login(token);

// God, please forgive us, this is just to keep the bot online at all cost
process.on("unhandledRejection", (reason, p) => {
    console.log(" [Error_Handling] :: Unhandled Rejection/Catch");
    console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
    console.log(" [Error_Handling] :: Uncaught Exception/Catch");
    console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.log(" [Error_Handling] :: Uncaught Exception/Catch (MONITOR)");
    console.log(err, origin);
});
