<template>
  <div class="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans">
    <slot />
  </div>
</template>

<style>
body {
  background-color: #0a0a0a;
  color: #e0e0e0;
  margin: 0;
  padding: 0;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #111; }
::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
</style>
