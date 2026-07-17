<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <NuxtLink
        to="/dashboard"
        class="text-lg font-semibold tracking-tight text-slate-900"
        :aria-label="t('nav.goDashboard')"
        @click="handleCloseMenu"
      >
        {{ appName }}
      </NuxtLink>

      <nav class="hidden items-center gap-6 md:flex">
        <NuxtLink
          to="/dashboard"
          class="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          {{ t('nav.dashboard') }}
        </NuxtLink>
        <NuxtLink
          to="/listing"
          class="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          {{ t('nav.mySets') }}
        </NuxtLink>
        <NuxtLink
          to="/community"
          class="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          {{ t('nav.community') }}
        </NuxtLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <LocaleSwitcher />
        <p
          v-if="user"
          class="text-sm text-slate-600"
        >
          {{ user.name }}
        </p>
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :aria-label="t('nav.logout')"
          tabindex="0"
          @click="handleLogout"
          @keydown.enter="handleLogout"
        >
          {{ t('nav.logout') }}
        </button>
      </div>

      <div class="flex items-center gap-2 md:hidden">
        <LocaleSwitcher />
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-nav-sidebar"
          :aria-label="isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          tabindex="0"
          @click="handleToggleMenu"
          @keydown.enter="handleToggleMenu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-6 w-6"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isMenuOpen"
        class="fixed inset-0 z-50 md:hidden"
        role="presentation"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 transition-opacity"
          aria-hidden="true"
          @click="handleCloseMenu"
        />

        <aside
          id="mobile-nav-sidebar"
          class="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          :aria-label="t('nav.menu')"
        >
          <div class="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <p class="text-lg font-semibold text-slate-900">
              {{ t('nav.menu') }}
            </p>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :aria-label="t('nav.closeMenu')"
              tabindex="0"
              @click="handleCloseMenu"
              @keydown.enter="handleCloseMenu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            <p
              v-if="user"
              class="mb-2 px-3 text-sm font-medium text-slate-500"
            >
              {{ user.name }}
            </p>

            <NuxtLink
              to="/dashboard"
              class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="handleCloseMenu"
            >
              {{ t('nav.dashboard') }}
            </NuxtLink>
            <NuxtLink
              to="/listing"
              class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="handleCloseMenu"
            >
              {{ t('nav.mySets') }}
            </NuxtLink>
            <NuxtLink
              to="/community"
              class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="handleCloseMenu"
            >
              {{ t('nav.community') }}
            </NuxtLink>
          </nav>

          <div class="border-t border-slate-200 p-4">
            <button
              type="button"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :aria-label="t('nav.logout')"
              tabindex="0"
              @click="handleLogout"
              @keydown.enter="handleLogout"
            >
              {{ t('nav.logout') }}
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </header>
</template>

<script setup>
const config = useRuntimeConfig()
const route = useRoute()
const appName = config.public.appName
const { user, logout } = useAuth()
const { t } = useLocale()
const isMenuOpen = ref(false)

const handleToggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleCloseMenu = () => {
  isMenuOpen.value = false
}

const handleLogout = async () => {
  handleCloseMenu()
  await logout()
}

watch(
  () => route.fullPath,
  () => {
    handleCloseMenu()
  },
)

watch(isMenuOpen, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = ''
})
</script>
