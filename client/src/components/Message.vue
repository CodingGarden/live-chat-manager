<template>
  <div
    :class="`message ${message.platform}-style`">
    <div class="avatar">
      <img :src="author.profileImageUrl" />
      <small>{{author.displayName}}</small>
    </div>
    <div style="padding: 20px">
      <span class="message-element" v-html="format(message.message)" />
    </div>
    <div class="buttons">
      <button>🚫</button>
      <button>🎉</button>
      <button @click="acknowledge(index, message)">✅</button>
    </div>
    <small class="time">{{timeAgo(message.publishedAt)}}</small>
  </div>
</template>

<script>
import timeago from 'timeago.js';
import marked from 'marked';
import createDOMPurify from 'dompurify';

const DOMPurify = createDOMPurify(window);
const timeagoInstance = timeago();

export default {
  props: ['author', 'message', 'index', 'acknowledge'],
  methods: {
    format(message) {
      return marked(DOMPurify.sanitize(message, { FORBID_ATTR: ['style'], FORBID_TAGS: ['table', 'script', 'audio', 'video', 'style', 'iframe', 'textarea'] }));
    },
    timeAgo(time) {
      return timeagoInstance.format(time);
    },
  },
};
</script>

<style>
.youtube-style {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%), url('/img/youtube.jpg');
  background-size: cover;
}
.twitch-style {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%), url('/img/twitch.jpg');
  background-size: cover;
}
.discord-style {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%), url('/img/discord.jpg');
  background-size: cover;
}

.message-element {
  background-color:rgba(0, 0, 0, 0.5);
  font-size: 20px;
  word-break: break-word;
  hyphens: auto;
}

.message .time {
  position: absolute;
  bottom: 10px;
  left: 20px;
}
</style>
