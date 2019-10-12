const express = require('express');
const fetch = require('node-fetch');
const tmi = require('tmi.js');
const db = require('monk')('localhost/chat-manager');

const events = db.get('events');

const socket = require('../socket');

const router = express.Router();

const STREAMS_URL = 'https://www.googleapis.com/youtube/v3/liveBroadcasts';
const MESSAGES_URL = 'https://www.googleapis.com/youtube/v3/liveChat/messages';
let listening = false;

const twitchClient = new tmi.Client({
  options: {
    debug: true,
  },
  connection: {
    reconnect: true,
    secure: true,
  },
  channels: ['#codinggarden'],
});

async function updateDB(liveChat) {
  try {
    await events.update({ id: liveChat.id }, {
      $set: {
        ...liveChat,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

async function getLatestMessages(io, liveChatId) {
  let nextPageToken = '';
  listening = true;

  const params = new URLSearchParams({
    liveChatId,
    part: 'snippet,authorDetails',
    maxResults: 2000,
    key: process.env.GOOGLE_API_KEY,
  });

  const liveChat = await events.findOne({ id: liveChatId });
  delete liveChat._id;

  twitchClient.connect();

  twitchClient.on('message', async (channel, userstate, message, self) => {
    const channelId = userstate['user-id'];
    if (!liveChat.authorsById[channelId]) {
      const response = await fetch(`https://api.twitch.tv/helix/users?id=${channelId}`, {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      });

      const json = await response.json();
      console.log(json);
      const { data: [{ profile_image_url: profileImageUrl }] } = json;

      const author = {
        channelId,
        channelUrl: `https://twitch.tv/${userstate.username}`,
        displayName: userstate['display-name'],
        isChatModerator: userstate.badges && (userstate.badges.moderator || userstate.badges.broadcaster),
        isChatOwner: false,
        isChatSponsor: false,
        isVerified: false,
        profileImageUrl,
      };
      liveChat.authorsById[channelId] = author;
      io.emit(`authors/${liveChatId}`, [author]);
      await updateDB(liveChat);
    }

    let messageWithEmotes = '';
    if (userstate.emotes) {
      const emoteIds = Object.keys(userstate.emotes);
      const emoteStart = emoteIds.reduce((starts, id) => {
        userstate.emotes[id].forEach((startEnd) => {
          const [start, end] = startEnd.split('-');
          starts[start] = {
            emoteUrl: `![](https://static-cdn.jtvnw.net/emoticons/v1/${id}/2.0)`,
            end,
          };
        });
        return starts;
      }, {});
      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        const emoteInfo = emoteStart[i];
        if (emoteInfo) {
          messageWithEmotes += emoteInfo.emoteUrl;
          i = emoteInfo.end;
        } else {
          messageWithEmotes += char;
        }
      }
    }

    const event = {
      id: userstate.id,
      message: messageWithEmotes || message,
      publishedAt: new Date(+userstate['tmi-sent-ts']),
      channelId,
      platform: 'twitch',
    };
    liveChat.messagesById[event.id] = event;
    liveChat.messages.push(event);
    io.emit(`messages/${liveChatId}`, [event]);
    await updateDB(liveChat);
  });

  // TODO: Show raids in chat ui
  // client.on('raided', (channel, username, viewers) => {})

  do {
    let url = `${MESSAGES_URL}?${params}`;
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }
    const response = await fetch(url);
    const result = await response.json();

    if (response.ok) {
      const newAuthors = [];

      if (result.items && result.items.length > 0) {
        const newMessages = result.items.map((item) => {
          const { id, snippet, authorDetails } = item;

          if (!liveChat.authorsById[authorDetails.channelId]) {
            liveChat.authorsById[authorDetails.channelId] = authorDetails;
            newAuthors.push(authorDetails);
          }

          const message = {
            id,
            message: snippet.displayMessage,
            publishedAt: snippet.publishedAt,
            channelId: authorDetails.channelId,
            platform: 'youtube',
          };

          if (snippet.type == 'superChatEvent') {
            message.superChat = snippet.superChatDetails;
          }

          liveChat.messagesById[id] = message;
          return message;
        });

        if (newMessages.length > 0) {
          console.log('new messages on backend...', liveChatId);
          newMessages.sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
          liveChat.messages = liveChat.messages.concat(newMessages);
          if (newAuthors.length > 0) {
            io.emit(`authors/${liveChatId}`, newAuthors);
          }
          io.emit(`messages/${liveChatId}`, newMessages);
        }
        await updateDB(liveChat);
      }
    } else {
      console.error(JSON.stringify(result, null, 2));
    }

    nextPageToken = result.nextPageToken;

    await new Promise((resolve) => {
      setTimeout(resolve, result.pollingIntervalMillis);
    });
  } while (nextPageToken);
}

router.get('/messages', async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  let liveChat = await events.findOne({ id });
  if (!liveChat) {
    liveChat = await events.insert({
      id,
      messages: [],
      messagesById: {},
      authorsById: {},
    });
  }
  if (!listening) {
    getLatestMessages(socket.io, id);
  }
  res.json(liveChat.messages);
});

router.get('/authors', async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  let liveChat = await events.findOne({ id });
  if (!liveChat) {
    liveChat = await events.insert({
      id,
      messages: [],
      messagesById: {},
      authorsById: {},
    });
  }
  if (!listening) {
    getLatestMessages(socket.io, id);
  }
  res.json(liveChat.authorsById);
});

router.get('/streams', async (req, res) => {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: 'UCLNgu_OupwoeESgtab33CCw',
    key: process.env.GOOGLE_API_KEY,
    type: 'video',
    eventType: 'live',
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
  const response = await fetch(url);
  const json = await response.json();
  if (json.items && json.items.length) {
    const liveStreams = await Promise.all(
      json.items.map(async (video) => {
        const videoParams = new URLSearchParams({
          part: 'liveStreamingDetails',
          id: video.id.videoId,
          key: process.env.GOOGLE_API_KEY,
        });
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?${videoParams}`;
        const videoResponse = await fetch(videoUrl);
        const data = await videoResponse.json();
        // eslint-disable-next-line
        video.snippet.liveChatId = data.items[0].liveStreamingDetails.activeLiveChatId;
        return {
          ...video,
          ...video.id,
          ...data.items[0],
        };
      }),
    );
    res.json(liveStreams);
  } else {
    res.json([]);
  }
});

module.exports = {
  getLatestMessages,
  router,
};
