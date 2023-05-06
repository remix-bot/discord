module.exports = async (client, queue, song) => {
    if (queue) {
        if (queue?.repeatMode !== 0) return;
        if (queue?.textChannel) {
            queue?.textChannel?.send({ content: `Playing 🎵: **${song.name}**` }).catch(e => { })
        }
    }
}