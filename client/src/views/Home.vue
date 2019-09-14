<template>
  <div class="mt-10">
    <v-card
      class="mx-auto"
      max-width="400"
      v-for="event in events"
      :key="event.id"
    >
      <v-img
        class="white--text"
        height="200px"
        :src="event.snippet.thumbnails.maxres.url"
      >
        <v-card-title class="align-end fill-height">{{event.snippet.title}}</v-card-title>
      </v-img>

      <v-card-actions>
        <v-btn
          text
          color="orange"
          :to="{
            name: 'chat',
            params: {
              id: event.snippet.liveChatId
            }
          }"
        >
          View Live Chat
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
const API_URL = 'http://localhost:5000/streams';
export default {
  components: {
  },
  data: () => ({
    events: [],
  }),
  async created() {
    const response = await fetch(API_URL);
    const json = await response.json();
    console.log(json);
    this.events = json.items;
  },
};
</script>
