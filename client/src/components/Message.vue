<template>
  <div :class="`message ${message.platform}-style`">
    <div class="avatar">
      <img :src="author.profileImageUrl" />
      <small>{{author.displayName}}</small>
    </div>
    <div style="padding: 20px">
      <span v-if="!showSource" class="message-element" v-html="format(message.message)" />
      <pre v-if="showSource" class="source"><code class="html">{{message.message}}</code></pre>
    </div>
    <div class="buttons">
      <v-btn text icon color="red" @click="setOffTopic(message)" v-if="setOffTopic">
        <v-icon>mdi-account-question</v-icon>
      </v-btn>
      <v-btn text icon color="green" @click="acknowledge(index, message)">
        <v-icon>mdi-checkbox-marked</v-icon>
      </v-btn>
    </div>
    <div class="source-view">
      <v-btn text icon color="yellow" @click="showSource = !showSource">
        <v-icon>mdi-xml</v-icon>
      </v-btn>
    </div>
    <small class="time">{{published}}</small>
  </div>
</template>

<script>
import timeago from 'timeago.js';
import marked from 'marked';
import createDOMPurify from 'dompurify';

const DOMPurify = createDOMPurify(window);
const timeagoInstance = timeago();

export default {
  props: ['author', 'message', 'index', 'acknowledge', 'setOffTopic'],
  data: vm => ({
    timeoutId: -1,
    published: timeagoInstance.format(vm.time),
    showSource: false,
  }),
  created() {
    // eslint-disable-next-line
    this.message.message = this.message.message.replace('javascript:', 'wat:').replace('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=l60MnDJklnM');
    this.updatePublished();
  },
  destroyed() {
    clearTimeout(this.timeoutId);
  },
  methods: {
    format(message) {
      return marked(
        DOMPurify.sanitize(message, {
          FORBID_ATTR: [
            'style',
            'onerror',
            'onload',
          ],
          FORBID_TAGS: [
            'table',
            'script',
            'audio',
            'video',
            'style',
            'iframe',
            'textarea',
          ],
        }),
      );
    },
    updatePublished() {
      this.published = timeagoInstance.format(this.message.publishedAt);
      this.timeoutId = setTimeout(() => {
        this.updatePublished();
      }, 60000);
    },
  },
};
</script>

<style>
.youtube-style {
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.5) 100%
    ),
    url("/img/youtube.jpg");
  background-size: cover;
}
.twitch-style {
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.5) 100%
    ),
    url("/img/twitch3.jpg");
  background-size: cover;
}
.discord-style {
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.5) 100%
    ),
    url("/img/discord.jpg");
  background-size: cover;
}

.message-element {
  background-color: rgba(0, 0, 0, 0.5);
  font-size: 20px;
  word-break: break-word;
  hyphens: auto;
}

.message .time {
  position: absolute;
  bottom: 10px;
  left: 20px;
}

.message .source-view {
  position: absolute;
  bottom: 10px;
  right: 20px;
}

.message .source {
  margin-top: 40px;
  margin-bottom: 80px;
}

.message-element img {
  max-width: 100%;
  height: auto;
}
</style>
