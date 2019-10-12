<template>
  <section class="app">
    <!-- <h2>{{unAckMessages.length}} / {{messages.length}}</h2> -->
    <div class="msg-section">
      <section class="un-ack-messages">
        <v-tabs
          v-model="tab"
          fixed-tabs
          background-color="black"
          dark
          icons-and-text
        >
          <v-tabs-slider></v-tabs-slider>

          <v-tab href="#tab-1">
            Messages
            <div class="text-center">
              <v-badge>
                <template v-slot:badge>{{unAckMessages.length}}</template>
                <v-icon>mdi-message-text</v-icon>
              </v-badge>
              <br />
            </div>
          </v-tab>

          <v-tab href="#tab-2">
            Greetings
            <div class="text-center">
              <v-badge>
                <template v-slot:badge>{{greetingMessages.length}}</template>
                <v-icon>mdi-human-greeting</v-icon>
              </v-badge>
              <br />
            </div>
          </v-tab>

          <v-tab href="#tab-3">
            Follows
            <div class="text-center">
              <v-badge>
                <template v-slot:badge>{{followMessages.length}}</template>
                <v-icon>mdi-heart</v-icon>
              </v-badge>
              <br />
            </div>
          </v-tab>

          <v-tab href="#tab-4">
            Questions
            <div class="text-center">
              <v-badge>
                <template v-slot:badge>{{offTopicMessages.length}}</template>
                <v-icon>mdi-account-question</v-icon>
              </v-badge>
              <br />
            </div>
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab">
          <v-tab-item
            value="tab-1"
          >
            <v-card flat color="black">
              <message
                style="width: 100%;"
                :key="message.id + 'un-ack'"
                v-for="(message, index) in unAckMessages"
                :platform="message.platform"
                :author="authors[message.channelId]"
                :message="message"
                :index="index"
                :setOffTopic="setOffTopic"
                :acknowledge="acknowledge"></message>
            </v-card>
          </v-tab-item>
          <v-tab-item
            value="tab-2"
          >
            <v-card flat color="black">
              <message
                style="width: 100%;"
                :key="message.id + 'greeting'"
                v-for="(message, index) in greetingMessages"
                :platform="message.platform"
                :author="authors[message.channelId]"
                :message="message"
                :index="index"
                :acknowledge="acknowledge"></message>
            </v-card>
          </v-tab-item>
          <v-tab-item
            value="tab-3"
          >
            <v-card flat color="black">
              <message
                style="width: 100%;"
                :key="message.id + 'follow'"
                v-for="(message, index) in followMessages"
                :platform="message.platform"
                :author="authors[message.channelId]"
                :message="message"
                :index="index"
                :acknowledge="acknowledge"></message>
            </v-card>
          </v-tab-item>
          <v-tab-item
            value="tab-4"
          >
            <v-card flat color="black">
              <message
                style="width: 100%;"
                :key="message.id + 'offtopice'"
                v-for="(message, index) in offTopicMessages"
                :platform="message.platform"
                :author="authors[message.channelId]"
                :message="message"
                :index="index"
                :acknowledge="acknowledge"></message>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </section>
      <section  class="all-messages">
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
    tab: null,
    messages: [],
    authors: {
    },
    ackMessages: localStorage.ackMessages ? JSON.parse(localStorage.ackMessages) : {},
    offTopic: localStorage.offTopic ? JSON.parse(localStorage.offTopic) : {},
  }),
  computed: {
    unAckMessages() {
      return this.messages.filter(m => !this.ackMessages[m.id] && !this.offTopic[m.id]);
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

.msg-section .un-ack-messages {
  width: 60%;
  padding: 1rem;
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

.message:nth-child(1n) {
  border: 1px solid #212122;
}

.message:nth-child(2n) {
  background-color: black;
}
</style>
