import { createRouter, createWebHistory } from 'vue-router'
import { checkAdminSession } from '@/api/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/views/admin/AdminLogin.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: {
        requiresAdminAuth: true,
      },
      children: [
        {
          path: '',
          redirect: '/admin/memories',
        },
        {
          path: 'memories',
          name: 'AdminMemoryList',
          component: () => import('@/views/admin/AdminMemoryList.vue'),
        },
        {
          path: 'memories/new',
          name: 'AdminMemoryCreate',
          component: () => import('@/views/admin/AdminMemoryForm.vue'),
        },
        {
          path: 'memories/:id/edit',
          name: 'AdminMemoryEdit',
          component: () => import('@/views/admin/AdminMemoryForm.vue'),
        },
      ],
    },
  ]
})

router.beforeEach(async (to) => {
  const requiresAdminAuth = to.matched.some((record) => record.meta.requiresAdminAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (!requiresAdminAuth && !guestOnly) {
    return true
  }

  const isAuthed = await checkAdminSession()

  if (requiresAdminAuth && !isAuthed) {
    return {
      name: 'AdminLogin',
      query: { redirect: to.fullPath },
    }
  }

  if (guestOnly && isAuthed) {
    return {
      name: 'AdminMemoryList',
    }
  }

  return true
})

export default router
