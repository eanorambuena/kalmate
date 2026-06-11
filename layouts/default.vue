<template>
  <div class="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans">
    <Header />
    <main class="max-w-7xl mx-auto px-4 py-4">
      <div class="mb-4">
        <SearchBar />
      </div>
      <slot />
    </main>
  </div>
</template>
