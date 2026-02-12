<template>
  <div class="app-container">
    <AppHeader />
    <main class="main-content">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "My Drive - Google Drive"
});
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png'
    },
  ]
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: linear-gradient(to top, #1e5db8 50%, #a8d8ea 100%);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 0;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
}
</style>
