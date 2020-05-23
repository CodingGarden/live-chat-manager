<template>
  <div :class="{
    message: true,
    [`${message.platform}-style`]: true,
    highlight: message.highlighted,
  }" style="-webkit-app-region: drag">
    <div class="avatar">
      <img :src="author.profileImageUrl" />
      <small>{{author.displayName}}</small>
    </div>
    <div style="padding: 20px">
      <span class="message-element" v-html="formatedMessage" />
      <pre v-if="showSource" class="source"><code class="html">{{message.message}}</code></pre>
    </div>
    <div class="buttons" v-if="!hideButtons">
      <v-btn text icon color="#E9CE2C" @click="setOffTopic(message)" v-if="setOffTopic">
        <v-icon>mdi-parking</v-icon>
      </v-btn>
      <v-btn text icon color="#23CE6B" @click="acknowledge(index, message)">
        <v-icon>mdi-checkbox-marked</v-icon>
      </v-btn>
    </div>
    <div class="source-view" v-if="message.isPotentiallyNaughty">
      <v-btn text icon color="yellow" @click="showSource = !showSource">
        <v-icon>mdi-xml</v-icon>
      </v-btn>
    </div>
    <small class="time">{{published}}</small>
  </div>
</template>

<script>
import * as timeago from 'timeago.js';
import marked from 'marked';
import createDOMPurify from 'dompurify';

const DOMPurify = createDOMPurify(window);

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('src')) {
    node.setAttribute('src', `https://yacdn.org/serve/${node.getAttribute('src')}`);
  }
});

export default {
  props: ['author', 'message', 'index', 'acknowledge', 'setOffTopic', 'hideButtons'],
  data: (vm) => ({
    timeoutId: -1,
    published: timeago.format(vm.time),
    showSource: false,
    formatedMessage: '',
  }),
  created() {
    // eslint-disable-next-line
    this.message.message = this.message.message.replace('javascript:', 'wat:').replace('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=l60MnDJklnM');
    this.updatePublished();
    this.formatedMessage = this.format(this.message.message);
  },
  destroyed() {
    clearTimeout(this.timeoutId);
  },
  methods: {
    format(message) {
      return DOMPurify
        .sanitize(marked(message), {
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
            'frame',
            'frameset',
          ],
        });
    },
    updatePublished() {
      this.published = timeago.format(this.message.publishedAt);
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
  background: #392F5A;
  /* background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.5) 100%
    ),
    url("/img/twitch3.jpg");
  background-size: cover; */
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
.highlight {
  background: #BD2D87;
  border: 10px solid #22DE1F;
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
