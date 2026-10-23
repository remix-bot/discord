const events = require('events');
const spotifyUrlInfo = require('spotify-url-info');
const spotify = spotifyUrlInfo(fetch);
const yts = require('yt-search');
const { workerData, parentPort } = require('worker_threads');

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function isSpotifyUrl(url) {
  if (!url || typeof url !== 'string') return false;
  url = url.trim();
  const spotifyRegex = /^(https?:\/\/)?(open\.)?spotify\.com\/(intl-[a-z]{2}\/)?(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)|^(spotify:(track|album|playlist|artist|episode):([a-zA-Z0-9]+))|^https?:\/\/spotify\.link\/[a-zA-Z0-9]+/i;
  return spotifyRegex.test(url);
}

class SpotifyUtils {
  constructor() {
    this.events = new events.EventEmitter();
    return this;
  }

  on(event, callback) {
    this.events.on(event, callback);
  }

  once(event, callback) {
    this.events.once(event, callback);
  }

  error(data) {
    this.events.emit("error", data);
  }

  async getVideoData(query) {
    query = (query || "").trim();

    // Enforce that only Spotify URLs can be played
    if (!isSpotifyUrl(query)) {
      this.events.emit("message", {
        content: "❌ **This bot only plays music from Spotify!**\nPlease provide a valid Spotify track, album, playlist, or artist link (e.g. `https://open.spotify.com/track/...`)."
      });
      return false;
    }

    this.events.emit("message", { content: "Loading Spotify information..." });

    let preview;
    try {
      preview = await spotify.getPreview(query);
    } catch (e) {
      this.error(e);
      this.events.emit("message", { content: "❌ **Failed to load Spotify information! Make sure the link is valid and public.**" });
      return false;
    }

    if (!preview) {
      this.events.emit("message", { content: "❌ **Could not find any Spotify media with that link!**" });
      return false;
    }

    let rawTracks;
    try {
      rawTracks = await spotify.getTracks(query);
    } catch (e) {
      this.error(e);
      this.events.emit("message", { content: "❌ **Failed to load tracks from this Spotify link!**" });
      return false;
    }

    if (!rawTracks || rawTracks.length === 0) {
      this.events.emit("message", { content: "❌ **No tracks found in the provided Spotify link!**" });
      return false;
    }

    if (rawTracks.length === 1 || preview.type === 'track') {
      const track = rawTracks[0];
      const trackTitle = track.name || preview.title || "Unknown Title";
      const trackArtist = track.artist || preview.artist || "Unknown Artist";
      const trackUrl = track.uri
        ? `https://open.spotify.com/track/${track.uri.split(':').pop()}`
        : (preview.link || query);

      // Pre-resolve first track stream ID using yt-search
      let videoId = null;
      try {
        const searchResult = await yts(`${trackArtist} - ${trackTitle}`);
        if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
          videoId = searchResult.videos[0].videoId;
        }
      } catch (err) {
        this.error("yts search error: " + err);
      }

      const songData = {
        title: trackTitle,
        author: { name: trackArtist },
        url: trackUrl,
        spotifyUri: track.uri || preview.embed,
        duration: {
          timestamp: formatDuration(track.duration),
          seconds: Math.floor((track.duration || 0) / 1000)
        },
        image: preview.image,
        videoId: videoId
      };

      this.events.emit("message", {
        content: `Successfully added [${songData.title}](${songData.url}) by **${songData.author.name}** to the queue.`
      });
      return { type: "video", data: songData };
    } else {
      // Album, Playlist, or Artist collection
      this.events.emit("message", {
        content: `Loading ${rawTracks.length} tracks from ${preview.type || 'collection'}...`
      });

      // Pre-resolve videoId for the first track so playback begins immediately
      let firstVideoId = null;
      try {
        const first = rawTracks[0];
        const searchResult = await yts(`${first.artist || preview.artist} - ${first.name}`);
        if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
          firstVideoId = searchResult.videos[0].videoId;
        }
      } catch (err) {
        this.error("yts search error for first track: " + err);
      }

      const formattedTracks = rawTracks.map((item, index) => {
        const itemTitle = item.name || "Unknown Title";
        const itemArtist = item.artist || preview.artist || "Unknown Artist";
        const itemUrl = item.uri
          ? `https://open.spotify.com/track/${item.uri.split(':').pop()}`
          : (preview.link || query);

        return {
          title: itemTitle,
          author: { name: itemArtist },
          url: itemUrl,
          spotifyUri: item.uri,
          duration: {
            timestamp: formatDuration(item.duration),
            seconds: Math.floor((item.duration || 0) / 1000)
          },
          image: preview.image,
          videoId: index === 0 ? firstVideoId : null
        };
      });

      const typeLabel = (preview.type || 'playlist').charAt(0).toUpperCase() + (preview.type || 'playlist').slice(1);
      this.events.emit("message", {
        content: `Successfully added **${typeLabel}** [${preview.title}](${preview.link || query}) with **${formattedTracks.length}** tracks to the queue.`
      });
      return { type: "list", data: formattedTracks };
    }
  }
}

const utils = new SpotifyUtils();

utils.events.on("message", (data) => {
  if (parentPort) {
    parentPort.postMessage(JSON.stringify(data));
  }
});

utils.events.on("error", (data) => {
  console.error("worker error: " + data);
});

if (workerData) {
  if (workerData.type === "command") {
    utils.getVideoData(workerData.query).then((videoData) => {
      if (videoData && parentPort) {
        parentPort.postMessage(JSON.stringify(videoData));
      }
    }).catch((e) => {
      console.error("command error: ", e);
      if (parentPort) {
        parentPort.postMessage(JSON.stringify({ content: "There was an error processing the Spotify link." }));
      }
    });
  } else if (workerData.type === "voiceCommand") {
    if (parentPort) {
      parentPort.postMessage(JSON.stringify({
        content: "❌ This bot only plays music from Spotify! Please use `/play` with a Spotify URL."
      }));
    }
  }
}
