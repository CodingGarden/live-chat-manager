import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Chat from './views/Chat.vue';
import LiveChat from './views/LiveChat.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/chat/:id',
      name: 'chat',
      component: Chat,
    },
    {
      path: '/chat/:id/live',
      name: 'live-chat',
      component: LiveChat,
    },
  ],
});
