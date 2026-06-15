import { createRouter, createWebHistory } from 'vue-router'
import { checkUserSession } from '@/api/userAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
      meta: {
        requiresUserAuth: true,
      },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginPage.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/publish/login',
      name: 'PublishLogin',
      component: () => import('@/views/publish/PublishLogin.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/publish',
      component: () => import('@/views/publish/PublishLayout.vue'),
      meta: {
        requiresUserAuth: true,
      },
      children: [
        {
          path: '',
          redirect: '/publish/memories',
        },
        {
          path: 'memories',
          name: 'PublishMemoryList',
          component: () => import('@/views/publish/PublishMemoryList.vue'),
        },
        {
          path: 'memories/new',
          name: 'PublishMemoryCreate',
          component: () => import('@/views/publish/PublishMemoryForm.vue'),
        },
        {
          path: 'memories/:id/edit',
          name: 'PublishMemoryEdit',
          component: () => import('@/views/publish/PublishMemoryForm.vue'),
        },
      ],
    },
  ]
})

router.beforeEach(async (to) => {
  const requiresUserAuth = to.matched.some((record) => record.meta.requiresUserAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (!requiresUserAuth && !guestOnly) {
    return true
  }

  const user = await checkUserSession()

  if (requiresUserAuth && !user) {
    const loginRoute = to.path.startsWith('/publish') ? 'PublishLogin' : 'Login'
    return {
      name: loginRoute,
      query: { redirect: to.fullPath },
    }
  }

  if (guestOnly && user) {
    const homeRoute = to.path.startsWith('/publish') ? 'PublishMemoryList' : 'Home'
    return { name: homeRoute }
  }

  return true
})

export default router
