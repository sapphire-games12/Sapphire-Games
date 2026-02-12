<template>
  <div class="header">
    <div class="header-content">
      <img src="/logo.png" alt="Sapphire Games Logo" class="logo" />
    </div>
    <div class="navbar">
        <a href="/">Home</a>
        <a href="/credits">Credits</a>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>

.header {
  width: 100%;
  background-image: linear-gradient(to bottom, #1e5eb800, #5aa5d5);
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
  color: blue;
  font-weight: 0.5rem;
  margin: 10px 1rem;
  text-decoration: none;
  font-size: 1rem;
}

.navbar a:hover {
  text-decoration: underline;
}
</style>