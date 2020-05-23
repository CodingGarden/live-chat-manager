<template>
  <section class="app">
    <div class="msg-section">
      <section  class="live-chat-all-messages">
        <message
          style="width: 100%;"
          :style="{
            opacity: ackMessages[message.id] ? 0.5 : 1
          }"
          :key="message.id + 'ack'"
          v-for="(message, index) in reversedMessages"
          :author="authors[message.channelId]"
          :message="message"
          :index="index"
          :hideButtons="true"
          :acknowledge="acknowledge"></message>
      </section>
    </div>
  </section>
</template>

<script>
import io from 'socket.io-client';

import Message from '../components/Message.vue';

const API_URL = 'http://localhost:5000';

const messageIds = new Set();
export default {
  components: {
    Message,
  },
  data: () => ({
    tab: null,
    messages: [],
    authors: {
    },
    ackMessages: localStorage.ackMessages ? JSON.parse(localStorage.ackMessages) : {},
    offTopic: localStorage.offTopic ? JSON.parse(localStorage.offTopic) : {},
  }),
  computed: {
    unAckMessages() {
      return this.messages.filter(m => !m.message.startsWith('!') && !this.ackMessages[m.id] && !this.offTopic[m.id]);
    },
    reversedMessages() {
      return this.messages.slice().reverse();
    },
    greetingMessages() {
      return this.messages.filter(m => !this.ackMessages[m.id] && m.message.match(/hi | hey |hello|good morning|good evening/gi));
    },
    followMessages() {
      return this.messages.filter(m => !this.ackMessages[m.id] && m.platform === 'twitch' && m.channelId === '105166207' && m.message.startsWith('Thank you for following'))
    },
    offTopicMessages() {
      return this.messages.filter(m => !this.ackMessages[m.id] && this.offTopic[m.id]);
    },
  },
  async mounted() {
    const { id } = this.$route.params;
    const [messages, authors] = await Promise.all([
      fetch(`${API_URL}/messages?id=${id}`).then(res => res.json()),
      fetch(`${API_URL}/authors?id=${id}`).then(res => res.json()),
    ]);
    this.messages = messages.filter((m) => {
      if (!messageIds.has(m.id)) {
        messageIds.add(m.id);
        m.isPotentiallyNaughty = m.message.match(/<|>/i);
        console.log('naughty...', m.message, m.isPotentiallyNaughty);
        return true;
      }
    });
    this.authors = authors;

    const socket = io(API_URL);
    console.log('listening for messages with id', id);
    socket.on(`messages/${id}`, (data) => {
      this.messages = this.messages.concat(data.filter((m) => {
      if (!messageIds.has(m.id)) {
        messageIds.add(m.id);
        m.isPotentiallyNaughty = m.message.match(/<|>/i);
        return true;
      } else {
        console.log('duplicate', m.id);
      }
    }));
    });
    socket.on(`authors/${id}`, (data) => {
      data.forEach((author) => {
        this.$set(this.authors, author.channelId, author);
      });
    });
  },
  methods: {
    acknowledge(index, message) {
      this.$set(this.ackMessages, message.id, true);
      localStorage.ackMessages = JSON.stringify(this.ackMessages);
    },
    setOffTopic(message) {
      this.$set(this.offTopic, message.id, true);
      localStorage.offTopic = JSON.stringify(this.offTopic);
    },
  },
};
</script>

<style>
body {
  font-family: sans-serif;
  box-sizing: border-box;

}

main {
  background-color: black;
}

.app {
  display: flex;
  flex-direction: column;
  margin: 0 10px;
}

.msg-section {
  display: flex;
}

.msg-section .all-messages {
  width: 40%;
  padding: 1rem;
}

.message {
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 20px;
  margin-bottom: 10px;
}

.avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
  flex-shrink: 0;
  text-align: center;
}

.avatar img {
  border-radius: 50%;
  height: 35px;
}

.avatar small {
  background-color:rgba(0, 0, 0, 0.7);
  padding: 0 5px;
}

.message p {
  padding: 1em;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.message .buttons {
  position: absolute;
  top: 10px;
  right: 10px;
}

.live-chat-all-messages {
  width: 100%;
}
</style>
