<template>
  <div
    :class="`message ${message.platform}-style`">
    <div class="avatar">
      <img :src="author.profileImageUrl" />
      <small>{{author.displayName}}</small>
    </div>
    <div style="padding: 20px">
      <span class="message-element">
      {{message.message}}
      </span>
    </div>
    <div class="buttons">
      <button>🚫</button>
      <button>🎉</button>
      <button @click="acknowledge(index, message)">✅</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['author', 'message', 'index', 'acknowledge'],
};
</script>

<style>
.youtube-style {
  background-image: url('/img/youtube.jpg');
  background-size: cover;
}
.twitch-style {
  background-image: url('/img/twitch.jpg');
  background-size: cover;
}
.discord-style {
  background-image: url('/img/discord.png');
  background-size: cover;
}

.message-element {
  background-color:rgba(0, 0, 0, 0.7);
  padding: 0 5px;
  font-size: 20px;
}
</style>
