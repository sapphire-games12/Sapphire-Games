<script setup>
import { error } from '#build/ui';

defineProps({
  error: {
    type: Object,
    required: true
  }
});

let title = error.statusCode === 404 ? 'Error 404 (Not Found)!!1' : 'Error ' + error.statusCode + "!!1";

useSeoMeta({
    title: title
});
</script>

<template>
  <div class="m-5 text-center">
    <h1>{{ error.statusCode === 404 ? 'Page Not Found' : 'An Error Occurred' }}</h1>
    <p>{{ error.message }}</p>
    <a href="/"><span>Go back to Sapphire Games</span></a>
  </div>
</template>

<style scoped>


</style>