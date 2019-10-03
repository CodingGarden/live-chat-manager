<template>
  <section class="app">
    <h2>{{unAckMessages}} / {{messages.length}}</h2>
    <div class="msg-section" >
      <section>
        <message
          style="width: 100%;"
          :key="message.id"
          v-for="(message, index) in messages"
          :platform="message.platform"
          v-if="!ackMessages[message.id]"
          :author="authors[message.channelId]"
          :message="message"
          :index="index"
          :acknowledge="acknowledge"></message>
      </section>
      <section>
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
    </div>
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
    authors: {
    },
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

main {
  background-color: black;
}

.app {
  display: flex;
  flex-direction: column;
  margin: 0 10px;
}

.app

.msg-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-column-gap: 10px;
  
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
  word-break: break-all;
}

.message .buttons {
  position: absolute;
  top: 10px;
  right: 10px;
}

.message:nth-child(1n) {
  border: 1px solid #212122;
}

.message:nth-child(2n) {
  background-color: black;
}
</style>
