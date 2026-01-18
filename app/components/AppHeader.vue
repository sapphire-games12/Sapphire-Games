<template>
  <div class="header">
    <div class="header-content">
      <img src="/logo.png" alt="Sapphire Games Logo" class="logo" />
      <nav class="navbar">
        <a href="/">Home</a>
        <a href="/save-manager">Save Manager</a>
      </nav>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>

.header {
  width: 100%;
  background-image: linear-gradient(to bottom, #1e5db8, #5aa5d5);
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  max-width: 100%;
}

.logo {
  max-width: 200px;
  height: auto;
  flex-shrink: 0;
}

.navbar {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 1rem;
}

.navbar a:hover {
  text-decoration: underline;
}
</style>