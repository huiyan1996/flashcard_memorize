<script setup>
definePageMeta({
  middleware: async () => {
    const { isAuthenticated, fetchUser } = useAuth()

    if (!isAuthenticated.value) {
      await fetchUser()
    }

    if (isAuthenticated.value) {
      return navigateTo('/dashboard')
    }

    return navigateTo('/login')
  },
})
</script>

<template>
  <div />
</template>
