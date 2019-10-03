<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>YouTube Chat Manager</span>
      </v-toolbar-title>
    </v-app-bar>
    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  data: () => ({
    //
  }),
  created() {
    this.$vuetify.theme.dark = true;
  },
};
</script>

<style>
.v-toolbar__content {
  background-color: rgb(0,0,0,0.75);
}
</style>