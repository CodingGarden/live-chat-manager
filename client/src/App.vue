<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <img src="/img/logo.png" class="logo" />
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

.logo {
  width: 50px;
}
</style>
