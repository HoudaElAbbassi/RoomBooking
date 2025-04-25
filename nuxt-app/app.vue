<!-- app.vue -->
<template>
  <div>
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex items-center">
        <i class="fas fa-calendar-check text-blue-500 text-2xl mr-3"></i>
        <h1 class="text-xl font-semibold">Raumbelegungssystem</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup>
// Keine Store-Importe hier im app.vue nötig
</script>