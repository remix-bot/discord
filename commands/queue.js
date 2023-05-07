const { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'queue',
    description: 'View previously queued tracks.',
    run: async (client, interaction) => {
        const queue = client.player.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: 'There is nothing in the queue right now!', ephemeral: true });

        const pageSize = 10;
        let page = parseInt(interaction.options?.get('page')?.value ?? 1);
        let start = (page - 1) * pageSize;
        let end = start + pageSize;

        const songs = queue.songs.slice(start, end);
        const q = songs
            .map((song, i) => `${start + i + 1}. ${song.name} - \`${song.formattedDuration}\``)
            .join('\n');

        const embed = new EmbedBuilder()
            .setDescription(`**Server Queue**\n${q}`)
            .setColor('#e9196c')
            .setFooter({ text: `Page ${page}` });

        const previousButton = new ButtonBuilder()
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('previous')
            .setDisabled(page === 1);

        const nextButton = new ButtonBuilder()
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('next')
            .setDisabled(end >= queue.songs.length);

        const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

        const reply = await interaction.reply({ embeds: [embed], components: [actionRow] });

        const filter = (interaction) => {
            return ['previous', 'next'].includes(interaction.customId) && interaction.user.id === interaction.user.id;
        };

        const collector = reply.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'previous') {
                page--;
                start = (page - 1) * pageSize;
                end = start + pageSize;

                const songs = queue.songs.slice(start, end);
                const q = songs
                    .map((song, i) => `${start + i + 1}. ${song.name} - \`${song.formattedDuration}\``)
                    .join('\n');

                embed.setDescription(`**Server Queue**\n${q}`).setFooter({ text: `Page ${page}` });
                previousButton.setDisabled(page === 1);
                nextButton.setDisabled(end >= queue.songs.length);

                await interaction.update({ embeds: [embed], components: [actionRow.setComponents([previousButton, nextButton])] });
            } else if (interaction.customId === 'next') {
                page++;
                start = (page - 1) * pageSize;
                end = start + pageSize;

                const songs = queue.songs.slice(start, end);
                const q = songs
                    .map((song, i) => `${start + i + 1}. ${song.name} - \`${song.formattedDuration}\``)
                    .join('\n');

                embed.setDescription(`**Server Queue**\n${q}`).setFooter({ text: `Page ${page}` });
                previousButton.setDisabled(page === 1);
                nextButton.setDisabled(end >= queue.songs.length);

                await interaction.update({ embeds: [embed], components: [actionRow.setComponents([previousButton, nextButton])] });
            }
        });

        collector.on('end', () => {
            actionRow.setComponents([previousButton.setDisabled(true), nextButton.setDisabled(true)]);
            interaction.editReply({ components: [actionRow] });
        });
    },
};
