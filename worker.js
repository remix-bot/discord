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

function youtubeVideoParser(url) {
  if (!url || typeof url !== 'string') return false;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
}

function youtubePlaylistParser(url) {
  if (!url || typeof url !== 'string') return false;
  const match = url.match(/[&?]list=([^&]+)/i);
  return (match || [0, false])[1];
}

class SearchUtils {
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
    if (!query) return false;

    // 1. Check for Spotify URLs
    if (isSpotifyUrl(query)) {
      this.events.emit("message", { content: "Loading Spotify information..." });

      let preview;
      try {
        preview = await spotify.getPreview(query);
      } catch (e) {
        this.error(e);
        this.events.emit("message", { content: "❌ **Failed to load Spotify link. Make sure it is public and valid.**" });
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
        const typeLabel = (preview.type || 'playlist').charAt(0).toUpperCase() + (preview.type || 'playlist').slice(1);
        this.events.emit("message", {
          content: `Loading ${rawTracks.length} tracks from ${typeLabel.toLowerCase()}...`
        });

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

        this.events.emit("message", {
          content: `Successfully added **${typeLabel}** [${preview.title}](${preview.link || query}) with **${formattedTracks.length}** tracks to the queue.`
        });
        return { type: "list", data: formattedTracks };
      }
    }

    // 2. Check for YouTube Playlist
    const playlistId = youtubePlaylistParser(query);
    if (playlistId) {
      this.events.emit("message", { content: "Loading playlist items..." });
      try {
        const res = await yts({ listId: playlistId });
        if (res && res.videos && res.videos.length > 0) {
          const formatted = res.videos.map(v => ({
            title: v.title,
            author: { name: v.author?.name || "YouTube" },
            url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
            duration: {
              timestamp: v.duration?.timestamp || "0:00",
              seconds: v.duration?.seconds || 0
            },
            image: v.thumbnail,
            videoId: v.videoId
          }));
          this.events.emit("message", {
            content: `Successfully added playlist with **${formatted.length}** videos to the queue.`
          });
          return { type: "list", data: formatted };
        }
      } catch (err) {
        this.error("Playlist error: " + err);
      }
    }

    // 3. YouTube Video URL or Text Search (e.g. "pop smoke")
    const videoId = youtubeVideoParser(query);
    this.events.emit("message", { content: `Searching for **${query}**...` });

    try {
      let video;
      if (videoId) {
        video = await yts({ videoId: videoId });
      } else {
        const searchResults = await yts(query);
        video = searchResults?.videos?.[0];
      }

      if (video) {
        const songData = {
          title: video.title,
          author: { name: video.author?.name || "YouTube" },
          url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
          duration: {
            timestamp: video.duration?.timestamp || video.timestamp || "0:00",
            seconds: video.duration?.seconds || video.seconds || 0
          },
          image: video.thumbnail || video.image,
          videoId: video.videoId
        };

        this.events.emit("message", {
          content: `Successfully added [${songData.title}](${songData.url}) by **${songData.author.name}** to the queue.`
        });
        return { type: "video", data: songData };
      } else {
        this.events.emit("message", { content: `❌ **No results found for "${query}"!**` });
        return false;
      }
    } catch (err) {
      this.error("Search error: " + err);
      this.events.emit("message", { content: `❌ **Error searching for "${query}".**` });
      return false;
    }
  }
}

const utils = new SearchUtils();

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
        parentPort.postMessage(JSON.stringify({ content: "There was an error processing the request." }));
      }
    });
  } else if (workerData.type === "voiceCommand") {
    utils.getVideoData(workerData.query).then((videoData) => {
      if (videoData && parentPort) {
        const payload = videoData.data || videoData;
        parentPort.postMessage({ type: "video", data: JSON.stringify(payload) });
      }
    }).catch((e) => {
      console.error("voice error: ", e);
    });
  }
}
