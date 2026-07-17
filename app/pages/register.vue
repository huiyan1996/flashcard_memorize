<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="absolute right-4 top-4 sm:right-6 sm:top-6">
      <LocaleSwitcher />
    </div>

    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-8 text-center">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">
          {{ appName }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-900">
          {{ t('auth.createAccount') }}
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          {{ t('auth.registerHint') }}
        </p>
      </div>

      <form
        class="space-y-5"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label
            for="name"
            class="mb-2 block text-sm font-medium text-slate-700"
          >
            {{ t('auth.name') }}
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            required
            minlength="2"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            :placeholder="t('auth.namePlaceholder')"
            :aria-label="t('auth.name')"
          >
        </div>

        <div>
          <label
            for="email"
            class="mb-2 block text-sm font-medium text-slate-700"
          >
            {{ t('auth.email') }}
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
            :aria-label="t('auth.email')"
          >
        </div>

        <div>
          <label
            for="password"
            class="mb-2 block text-sm font-medium text-slate-700"
          >
            {{ t('auth.password') }}
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            :placeholder="t('auth.passwordPlaceholder')"
            :aria-label="t('auth.password')"
          >
        </div>

        <p
          v-if="errorMessage"
          class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitting"
          :aria-label="t('auth.createAccountButton')"
        >
          {{ isSubmitting ? t('auth.creatingAccount') : t('auth.createAccountButton') }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-600">
        {{ t('auth.haveAccount') }}
        <NuxtLink
          to="/login"
          class="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {{ t('auth.signIn') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const config = useRuntimeConfig()
const appName = config.public.appName
const { register } = useAuth()
const { t } = useLocale()

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await register({
      name: form.name,
      email: form.email,
      password: form.password,
    })

    await navigateTo('/dashboard')
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || t('auth.registerFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>
