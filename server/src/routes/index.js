const express = require('express');
const fetch = require('node-fetch');
const tmi = require('tmi.js');
const TPS = require('twitchps');
const Filter = require('bad-words');
const db = require('monk')('localhost/chat-manager');

const events = db.get('events');

const socket = require('../socket');
const followMessages = require('../followMessages');

const router = express.Router();

// const MESSAGES_URL = 'https://www.googleapis.com/youtube/v3/liveChat/messages';
const listening = {};
const badWordFilter = new Filter({ placeHolder: '💚' });

const getRandomFollowMessage = () => followMessages[
  Math.floor(Math.random() * followMessages.length)
];

const youtubeChannelEmotes = {
  ':cdgSeedling:': 'https://yt3.ggpht.com/TZQBMEOI6HJIvCAdr_0lt-Y9RuibZpDCb-Gih7xxY2vBVZ93a4c_hKcL5GRKafLaIPvCee3ar3c=w24-h24-c-k-nd',
  ':cdgCJsmile:': 'https://yt3.ggpht.com/EHQaFtWsiqyoA8I-xDEUk_GASHbF-IzTolMXctwNXeu9JZ5br9quyWqhY8YOeVWRYKVa__h1ZHw=w24-h24-c-k-nd',
  ':cdgCJthink:': 'https://yt3.ggpht.com/A2rEpbhkn2z3Em8aOg1_8dVdvOR_iR7Bd9ChVgtLzfhLOh76jb_KIJj2fJNCRstazTm9fNBWC6Y=w24-h24-c-k-nd',
  ':cdgCJpixel:': 'https://yt3.ggpht.com/8VysDeeBLAo5QRLhmka6H0Z9cIuFISC4O6HswiYqHEnhmZAlGqOHN_pM2kyhU04qL79XkOmmvQ=w24-h24-c-k-nd',
  ':cdgAlca:': 'https://yt3.ggpht.com/B4CCyqp0k6R6ktde8iHY1w_MJz2qlffNyGH7eJQFP-l2HjBwSGd-SHWvzS8VIiwM-A_zdP6GIjg',
  ':cdgCJS:': 'https://yt3.ggpht.com/uVcMtvwFgMErnBjl9C5RA5dIsxyfEH2jhXKvSyHbSdjQUd-IUF68xpI9DJ8N8VJkz704ln1ClQ',
  ':cdgBJS:': 'https://yt3.ggpht.com/i5WW1DZXRiQLv4d813kt_4GDYF6OJ5n59vMdq2QQ7eFC-dcFOkWAVn5q1JtJjSTnEsQ2hvPRPg',
  ':cdgYerba:': 'https://yt3.ggpht.com/-7EPZ9U7Jhxa0j9ATpaxVPIaBW_h_IFMA8e6-ggm6ed6Cnk9PJ6qQ3oJDbjq3gnFdbtiaoYSQ6s=w48-h48-c-k-nd',
};
const youtubeEmotes = {
  ':yt:': 'https://yt3.ggpht.com/m6yqTzfmHlsoKKEZRSZCkqf6cGSeHtStY4rIeeXLAk4N9GY_yw3dizdZoxTrjLhlY4r_rkz3GA=w24-h24-c-k-nd',
  ':oops:': 'https://yt3.ggpht.com/qByNS7xmuQXsb_5hxW2ggxwQZRN8-biWVnnKuL5FK1zudxIeim48zRVPk6DRq_HgaeKltHhm=w24-h24-c-k-nd',
  ':buffering:': 'https://yt3.ggpht.com/foWgzjN0ggMAA0CzDPfPZGyuGwv_7D7Nf6FGLAiomW5RRXj0Fs2lDqs2U6L52Z4J2Zb-D5tCUAA=w24-h24-c-k-nd',
  ':stayhome:': 'https://yt3.ggpht.com/u3QDxda8o4jrk_b01YtJYKb57l8Zw8ks8mCwGkiZ5hC5cQP_iszbsggxIWquZhuLRBzl5IEM2w=w24-h24-c-k-nd',
  ':dothefive:': 'https://yt3.ggpht.com/ktU04FFgK_a6yaXCS1US-ReFkLjD22XllcIMOyBRHuYKLsrxpVxsauV1gSC2RPraMJWXpWcY=w24-h24-c-k-nd',
  ':elbowbump:': 'https://yt3.ggpht.com/gt39CIfizoIAce9a8IzjfrADV5CjTbSyFKUlLMXzYILxJRjwAgYQQJ9PXXxnRvrnTec7ZpfHN4k=w24-h24-c-k-nd',
  ':goodvibes:': 'https://yt3.ggpht.com/6LPOiCw9bYr3ZXe8AhUoIMpDe_0BglC4mBmi-uC4kLDqDIuPu4J3ErgV0lEhgzXiBluq-I8j=w24-h24-c-k-nd',
  ':thanksdoc:': 'https://yt3.ggpht.com/Av7Vf8FxIp0_dQg4cJrPcGmmL7v9RXraOXMp0ZBDN693ewoMTHbbS7D7V3GXpbtZPSNcRLHTQw=w24-h24-c-k-nd',
  ':videocall:': 'https://yt3.ggpht.com/bP-4yir3xZBWh-NKO4eGJJglr8m4dRnHrAKAXikaOJ0E5YFNkJ6IyAz3YhHMyukQ1kJNgQAo=w24-h24-c-k-nd',
  ':virtualhug:': 'https://yt3.ggpht.com/-o0Di2mE5oaqf_lb_RI3igd0fptmldMWF9kyQpqKWkdAd7M4cT5ZKzDwlmSSXdcBp3zVLJ41yg=w24-h24-c-k-nd',
  ':yougotthis:': 'https://yt3.ggpht.com/WxLUGtJzyLd4dcGaWnmcQnw9lTu9BW3_pEuCp6kcM2pxF5p5J28PvcYIXWh6uCm78LxGJVGn9g=w24-h24-c-k-nd',
  ':sanitizer:': 'https://yt3.ggpht.com/4PaPj_5jR1lkidYakZ4EkxVqNr0Eqp4g0xvlYt_gZqjTtVeyHBszqf57nB9s6uLh7d2QtEhEWEc=w24-h24-c-k-nd',
  ':takeout:': 'https://yt3.ggpht.com/ehUiXdRyvel0hba-BopQoDWTvM9ogZcMPaaAeR6IA9wkocdG21aFVN_IylxRGHtl2mE6L9jg1Do=w24-h24-c-k-nd',
  ':hydrate:': 'https://yt3.ggpht.com/Plqt3RM7NBy-R_eA90cIjzMEzo8guwE0KqJ9QBeCkPEWO7FvUqKU_Vq03Lmv9XxMrG6A3Ouwpg=w24-h24-c-k-nd',
  ':chillwcat:': 'https://yt3.ggpht.com/ZN5h05TnuFQmbzgGvIfk3bgrV-_Wp8bAbecOqw92s2isI6GLHbYjTyZjcqf0rKQ5t4jBtlumzw=w24-h24-c-k-nd',
  ':chillwdog:': 'https://yt3.ggpht.com/jiaOCnfLX0rqed1sISxULaO7T-ktq2GEPizX9snaxvMLxQOMmWXMmAVGyIbYeFS2IvrMpxvFcQ=w24-h24-c-k-nd',
  ':elbowcough:': 'https://yt3.ggpht.com/kWObU3wBMdHS43q6-ib2KJ-iC5tWqe7QcEITaNApbXEZfrik9E57_ve_BEPHO86z4Xrv8ikMdW0=w24-h24-c-k-nd',
  ':learning:': 'https://yt3.ggpht.com/LiS1vw8KUXmczimKGfA-toRYXOcV1o-9aGSNRF0dGLk15Da2KTAsU-DXkIao-S7-kCkSnJwt=w24-h24-c-k-nd',
  ':washhands:': 'https://yt3.ggpht.com/66Fn-0wiOmLDkoKk4FSa9vD0yymtWEulbbQK2x-kTBswQ2auer_2ftvmrJGyMMoqEGNjJtipBA=w24-h24-c-k-nd',
  ':socialdist:': 'https://yt3.ggpht.com/0WD780vTqUcS0pFq423D8WRuA_T8NKdTbRztChITI9jgOqOxD2r6dthbu86P6fIggDR6omAPfnQ=w24-h24-c-k-nd',
  ':shelterin:': 'https://yt3.ggpht.com/KgaktgJ3tmEFB-gMtjUcuHd6UKq50b-S3PbHEOSUbJG7UddPoJSmrIzysXA77jJp5oRNLWG84Q=w24-h24-c-k-nd',
};

const youtubeEmoteRegex = new RegExp(Object.keys(youtubeEmotes).join('|'), 'g');
const youtubeChannelEmoteRegex = new RegExp(Object.keys(youtubeChannelEmotes).join('|'), 'g');

let lastUpdated = {};

const bttvEmotes = {};
let bttvRegex;
const ffzEmotes = {};
let ffzRegex;

async function getBttvEmotes() {
  const bttvResponse = await fetch('https://api.betterttv.net/3/cached/emotes/global');
  let emotes = await bttvResponse.json();
  const bttvChannelResponse = await fetch('https://api.betterttv.net/3/cached/users/twitch/413856795');
  const { channelEmotes, sharedEmotes } = await bttvChannelResponse.json();
  emotes = emotes.concat(channelEmotes).concat(sharedEmotes);
  let regexStr = '';
  emotes.forEach(({ code, id }, i) => {
    bttvEmotes[code] = id;
    regexStr += code.replace(/\(/, '\\(').replace(/\)/, '\\)') + (i === emotes.length - 1 ? '' : '|');
  });
  bttvRegex = new RegExp(`(?<=^|\\s)(${regexStr})(?=$|\\s)`, 'g');
  console.log(bttvEmotes);
  console.log(bttvRegex);
}

async function getFfzEmotes() {
  const ffzResponse = await fetch('https://api.frankerfacez.com/v1/set/global');
  const ffzChannelResponse = await fetch('https://api.frankerfacez.com/v1/room/codinggarden');
  const { sets } = await ffzResponse.json();
  const { sets: channelSets } = await ffzChannelResponse.json();
  let regexStr = '';
  const appendEmotes = ({ name, urls }, i, emotes) => {
    ffzEmotes[name] = `https:${Object.values(urls).pop()}`;
    regexStr += name + (i === emotes.length - 1 ? '' : '|');
  };
  sets[3].emoticons.forEach(appendEmotes);
  regexStr += '|';
  channelSets[609613].emoticons.forEach(appendEmotes);
  ffzRegex = new RegExp(`(?<=^|\\s)(${regexStr})(?=$|\\s)`, 'g');
  console.log(ffzEmotes);
  console.log(ffzRegex);
}

getBttvEmotes();
getFfzEmotes();

const twitchClient = new tmi.Client({
  options: {
    debug: true,
  },
  connection: {
    reconnect: true,
    secure: true,
  },
  channels: [process.env.TWITCH_CHANNEL],
});

async function updateDB(liveChat) {
  try {
    await events.update({
      id: liveChat.id,
    }, {
      $set: {
        ...liveChat,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

// const init_topics = [{
//   topic: 'dashboard-activity-feed.413856795',
//   token: process.env.TWITCH_TOKEN,
// }];

const init_topics = [{
  topic: 'channel-points-channel-v1.413856795',
  token: process.env.TWITCH_TOKEN,
}];

async function getLatestMessages(io, liveChatId) {
  if (listening[liveChatId]) return;
  const nextPageToken = '';
  listening[liveChatId] = true;

  const params = new URLSearchParams({
    liveChatId,
    part: 'snippet,authorDetails',
    maxResults: 2000,
    key: process.env.GOOGLE_API_KEY,
  });

  const liveChat = await events.findOne({
    id: liveChatId,
  });
  delete liveChat._id;

  twitchClient.connect();

  twitchClient.on('messagedeleted', async (channel, username, deletedMessage, userstate) => {
    const id = userstate['target-msg-id'];
    delete liveChat.messagesById[id];
    const originalMessageIndex = liveChat.messages.findIndex((m) => m.id == id);
    liveChat.messages.splice(originalMessageIndex, 1);
    io.emit(`message-deleted/${liveChatId}`, id);
    await updateDB(liveChat);
  });
  const followAuthor = {
    channelId: 43,
    channelUrl: 'https://twitch.tv/samwisegardener',
    displayName: '👋 Follow 👋',
    isChatOwner: false,
    isChatModerator: false,
    isChatSponsor: false,
    isChatFounder: false,
    isVip: false,
    isVerified: false,
    profileImageUrl: 'https://i.imgur.com/rD7b0Ki.png',
  };
  twitchClient.on('message', async (channel, userstate, message) => {
    const channelId = userstate['user-id'];
    userstate.badges = userstate.badges || {};
    const isChatModerator = !!(userstate.badges.moderator || userstate.badges.broadcaster);
    const shouldUpdate = (message === '!refreshuser') && (isChatModerator || (!lastUpdated[channelId]) || (lastUpdated[channelId] < Date.now() - (30 * 60 * 1000)));
    if (shouldUpdate || !liveChat.authorsById[channelId]) {
      lastUpdated[channelId] = Date.now();
      const response = await fetch(`https://api.twitch.tv/kraken/users/${channelId}`, {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Accept: 'application/vnd.twitchtv.v5+json',
        },
      });

      const json = await response.json();
      console.log(json);
      const {
        logo: profileImageUrl,
      } = json;

      const author = {
        channelId,
        channelUrl: `https://twitch.tv/${userstate.username}`,
        displayName: userstate['display-name'],
        isChatOwner: false,
        isChatModerator,
        isChatSponsor: !!(userstate.badges.founder || userstate.badges.subscriber),
        isChatFounder: !!userstate.badges.founder,
        isVip: !!userstate.badges.vip,
        isVerified: false,
        profileImageUrl,
      };
      liveChat.authorsById[channelId] = author;
      io.emit(`authors/${liveChatId}`, [author]);
      await updateDB(liveChat);
    } else {
      liveChat.authorsById[channelId] = {
        ...liveChat.authorsById[channelId],
        displayName: userstate['display-name'],
        isChatModerator: !!(userstate.badges.moderator || userstate.badges.broadcaster),
        isChatSponsor: !!(userstate.badges.founder || userstate.badges.subscriber),
        isChatFounder: !!userstate.badges.founder,
        isVip: !!userstate.badges.vip,
      };
    }

    if (message.startsWith('!team')) {
      const team = message.split(' ')[1];
      const author = liveChat.authorsById[channelId];
      if (team && author) {
        if (team === 'clear') {
          delete author.team;
        } else {
          author.team = team.toLowerCase();
        }
        io.emit(`authors/${liveChatId}`, [author]);
        await updateDB(liveChat);
        return;
      }
    }

    if (userstate.username === 'streamlabs') {
      const followedUsername = (message.match(/Thank you for following on Twitch (.*)!/) || [])[1];
      if (followedUsername) {
        const contents = getRandomFollowMessage().replace(/\{\{username\}\}/g, followedUsername);
        const event = {
          id: userstate.id,
          message: contents,
          unfilteredMessage: contents,
          publishedAt: new Date(+userstate['tmi-sent-ts']),
          channelId,
          platform: 'twitch',
          author: followAuthor,
          highlighted: false,
          follow: true,
        };
        liveChat.messagesById[event.id] = event;
        liveChat.messages.push(event);
        io.emit(`messages/${liveChatId}`, [event]);
        return updateDB(liveChat);
      }
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
      const parts = Array.from(message);
      for (let i = 0; i < parts.length; i++) {
        const char = parts[i];
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
      message: (liveChat.authorsById[channelId].isChatModerator) ? (messageWithEmotes || message).replace(youtubeChannelEmoteRegex, (emote) => `![](${youtubeChannelEmotes[emote]}#emote)`) : badWordFilter.clean(messageWithEmotes || message),
      unfilteredMessage: messageWithEmotes || message,
      publishedAt: new Date(+userstate['tmi-sent-ts']),
      channelId,
      platform: 'twitch',
      author: liveChat.authorsById[channelId],
      highlighted: userstate['msg-id'] === 'highlighted-message',
    };

    event.message = event.message.replace(bttvRegex, (name) => `![${name}](https://cdn.betterttv.net/emote/${bttvEmotes[name]}/2x#emote)`);
    event.message = event.message.replace(ffzRegex, (name) => `![](${ffzEmotes[name]}#emote)`);
    event.message = event.message.replace(youtubeEmoteRegex, (emote) => `![](${youtubeEmotes[emote]}#emote)`);
    // event.message = cleanMessage(event.message);
    liveChat.messagesById[event.id] = event;
    liveChat.messages.push(event);
    io.emit(`messages/${liveChatId}`, [event]);
    await updateDB(liveChat);
  });

  const pubSub = new TPS({
    init_topics,
    reconnect: true,
    debug: false,
  });

  const rewardAuthor = {
    channelId: 42,
    channelUrl: 'https://twitch.tv/samwisegardener',
    displayName: '🎉 Reward Redemption 🎉',
    isChatOwner: false,
    isChatModerator: false,
    isChatSponsor: false,
    isChatFounder: false,
    isVip: false,
    isVerified: false,
    profileImageUrl: 'https://i.imgur.com/pukCZL7.png',
  };

  pubSub.on('channel-points', async (data) => {
    try {
      const { redemption } = data;
      const message = `${redemption.user.display_name || redemption.user.login} has redeemed:<br><h2>${redemption.reward.title}</h2><h3>${redemption.reward.prompt}</h3>`;
      const event = {
        id: redemption.id,
        message,
        unfilteredMessage: message,
        publishedAt: new Date(data.timestamp),
        channelId: 42,
        platform: 'twitch',
        author: rewardAuthor,
        reward: true,
        rewardId: redemption.reward.id,
      };
      liveChat.messagesById[event.id] = event;
      liveChat.messages.push(event);
      io.emit(`messages/${liveChatId}`, [event]);
      await updateDB(liveChat);
    } catch (error) {
      console.log('error sending redemption message', data, error);
    }
  });

  // do {
  //   let url = `${MESSAGES_URL}?${params}`;
  //   if (nextPageToken) {
  //     url += `&pageToken=${nextPageToken}`;
  //   }
  //   const response = await fetch(url);
  //   const result = await response.json();

  //   if (response.ok) {
  //     const newAuthors = [];

  //     if (result.items && result.items.length > 0) {
  //       // eslint-disable-next-line
  //       const newMessages = result.items.map((item) => {
  //         const {
  //           id,
  //           snippet,
  //           authorDetails,
  //         } = item;

  //         if (!liveChat.authorsById[authorDetails.channelId]) {
  //           liveChat.authorsById[authorDetails.channelId] = authorDetails;
  //           newAuthors.push(authorDetails);
  //         }

  //         const cleanMessage = badWordFilter.clean(snippet.displayMessage);

  //         const message = {
  //           id,
  //           message: (authorDetails.isChatOwner || authorDetails.isChatModerator || authorDetails.isChatSponsor) ? cleanMessage.replace(youtubeChannelEmoteRegex, (emote) => `![](${youtubeChannelEmotes[emote]}#emote)`) : cleanMessage,
  //           unfilteredMessage: snippet.displayMessage,
  //           publishedAt: snippet.publishedAt,
  //           channelId: authorDetails.channelId,
  //           platform: 'youtube',
  //           author: authorDetails,
  //         };

  //         message.message = message.message.replace(bttvRegex, (name) => `![${name}](https://cdn.betterttv.net/emote/${bttvEmotes[name]}/2x#emote)`);
  //         message.message = message.message.replace(ffzRegex, (name) => `![](${ffzEmotes[name]}#emote)`);
  //         message.message = message.message.replace(youtubeEmoteRegex, (emote) => `![](${youtubeEmotes[emote]}#emote)`);

  //         if (snippet.type === 'superChatEvent') {
  //           message.superChat = snippet.superChatDetails;
  //         }

  //         liveChat.messagesById[id] = message;
  //         return message;
  //       });

  //       if (newMessages.length > 0) {
  //         newMessages.sort((a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt));
  //         liveChat.messages = liveChat.messages.concat(newMessages);
  //         if (newAuthors.length > 0) {
  //           io.emit(`authors/${liveChatId}`, newAuthors);
  //         }
  //         io.emit(`messages/${liveChatId}`, newMessages);
  //       }
  //       await updateDB(liveChat);
  //     }
  //   } else {
  //     console.error(JSON.stringify(result, null, 2));
  //   }

  //   nextPageToken = result.nextPageToken;

  //   await new Promise((resolve) => {
  //     setTimeout(resolve, result.pollingIntervalMillis);
  //   });
  // } while (nextPageToken);
}

router.get('/messages', async (req, res, next) => {
  const {
    id,
  } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  let liveChat = await events.findOne({
    id,
  });
  if (!liveChat) {
    liveChat = await events.insert({
      id,
      messages: [],
      messagesById: {},
      authorsById: {},
      team: {},
    });
  }
  if (!listening[id]) {
    getLatestMessages(socket.io, id);
  }
  return res.json(liveChat.messages);
});

router.get('/authors', async (req, res, next) => {
  const {
    id,
  } = req.query;
  if (!id) return next(new Error('Invalid chat id.'));
  let liveChat = await events.findOne({
    id,
  });
  if (!liveChat) {
    liveChat = await events.insert({
      id,
      messages: [],
      messagesById: {},
      authorsById: {},
      team: {},
    });
  }
  if (!listening[id]) {
    getLatestMessages(socket.io, id);
  }
  return res.json(liveChat.authorsById);
});

async function getEvents(eventType) {
  const params = new URLSearchParams({
    part: 'snippet',
    channelId: process.env.YOUTUBE_CHANNEL_ID,
    key: process.env.GOOGLE_API_KEY,
    type: 'video',
    eventType,
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
  const response = await fetch(url);
  const json = await response.json();
  console.log(json);
  return json;
}

router.get('/streams', async (req, res) => {
  const [liveEvents, upcomingEvents] = await Promise.all([
    getEvents('live'),
    getEvents('upcoming'),
  ]);

  const events = [].concat(liveEvents.items || [], upcomingEvents.items || []);

  if (events.length) {
    const liveStreams = await Promise.all(
      events.map(async (video) => {
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
