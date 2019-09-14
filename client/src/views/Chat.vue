<template>
  <section class="app">
    <section class="messages">
      <h2>{{unAckMessages}} / {{messages.length}}</h2>
      <message
        style="width: 100%;"
        :key="message.id"
        v-for="(message, index) in messages"
        v-if="!ackMessages[message.id]"
        :author="authors[message.channelId]"
        :message="message"
        :index="index"
        :acknowledge="acknowledge"></message>
    </section>
    <section class="live-messages">
      <message
        style="width: 100%;"
        :style="{
          opacity: ackMessages[message.id] ? 0.5 : 1
        }"
        :key="message.id"
        v-for="(message, index) in reversedMessages"
        :author="authors[message.channelId]"
        :message="message"
        :index="index"
        :acknowledge="acknowledge"></message>
    </section>
  </section>
</template>

<script>
import io from 'socket.io-client';

import Message from '../components/Message.vue';

const API_URL = 'http://localhost:5000';

export default {
  components: {
    Message,
  },
  data: () => ({
    messages: [],
    authors: {},
    ackMessages: localStorage.ackMessages ? JSON.parse(localStorage.ackMessages) : {},
  }),
  computed: {
    unAckMessages() {
      return this.messages.length - Object.keys(this.ackMessages).length;
    },
    reversedMessages() {
      return this.messages.slice().reverse();
    },
  },
  async mounted() {
    const { id } = this.$route.params;
    const [messages, authors] = await Promise.all([
      fetch(`${API_URL}/messages?id=${id}`).then(res => res.json()),
      fetch(`${API_URL}/authors?id=${id}`).then(res => res.json()),
    ]);
    this.messages = messages;
    this.authors = authors;

    const socket = io(API_URL);
    console.log('listening for messages with id', id);
    socket.on(`messages/${id}`, (data) => {
      this.messages = this.messages.concat(data);
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
  },
};
</script>

<style>
body {
  font-family: sans-serif;
  box-sizing: border-box;
}

.app {
  display: flex;
}

.messages {
  width: 60%;
  display: flex;
  flex-wrap: wrap;
  flex-grow: 0;
}

.live-messages {
  width: 40%;
  flex-grow: 0;
  position: fixed;
  right: 0;
  overflow: scroll;
  height: 100vh;
}

.message {
  display: flex;
  align-items: center;
  position: relative;
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
  height: 30px;
}

.message p {
  padding: 1em;
  overflow-wrap: break-word;
  word-break: break-all;
}

.message .buttons {
  position: absolute;
  top: 0;
  right: 0;
}

.message:nth-child(1n) {
  border: 1px solid #EEE;
}

.message:nth-child(2n) {
  background-color: #EEE;
}
</style>
