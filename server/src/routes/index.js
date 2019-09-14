const express = require('express');
const fetch = require('node-fetch');

const socket = require('../socket');

const router = express.Router();

const STREAMS_URL = 'https://www.googleapis.com/youtube/v3/liveBroadcasts';
const MESSAGES_URL = 'https://www.googleapis.com/youtube/v3/liveChat/messages';
const liveChats = {};

async function getLatestMessages(io, liveChatId) {
  let nextPageToken = '';

  const params = new URLSearchParams({
    liveChatId,
    part: 'snippet,authorDetails',
    maxResults: 2000,
    key: process.env.GOOGLE_API_KEY,
  });

  const liveChat = liveChats[liveChatId];

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

router.get('/messages', (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  if (!liveChats[id]) {
    liveChats[id] = {
      messages: [],
      messagesById: {},
      authorsById: {},
    };
    getLatestMessages(socket.io, id);
  }
  res.json(liveChats[id].messages);
});

router.get('/authors', (req, res) => {
  const { id } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  if (!liveChats[id]) {
    liveChats[id] = {
      messages: [],
      messagesById: {},
      authorsById: {},
    };
    getLatestMessages(socket.io, id);
  }
  res.json(liveChats[id].authorsById);
});

router.get('/streams', async (req, res) => {
  const params = new URLSearchParams({
    part: 'snippet',
    broadcastStatus: 'active',
    key: process.env.GOOGLE_API_KEY,
  });

  const url = `${STREAMS_URL}?${params}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GOOGLE_TOKEN}`,
    },
  });
  const json = await response.json();
  res.json(json);
});

module.exports = {
  getLatestMessages,
  router,
};
