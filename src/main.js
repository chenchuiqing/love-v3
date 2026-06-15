import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { checkUserSession } from '@/api/userAuth';
import './styles/globals.css';

async function init() {
  // 应用挂载前先检查登录状态，避免组件挂载后再触发 401 请求
  await checkUserSession().catch(() => null);

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
}

init();
