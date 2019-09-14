<template>
  <div
    class="message">
    <div class="avatar">
      <img :src="author.profileImageUrl" />
      <small>{{author.displayName}}</small>
    </div>
    <div class="message-contents">
      <p>
      {{message.message}}
      </p>
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
