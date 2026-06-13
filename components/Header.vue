<template>
  <header class="bg-[#111] border-b border-[#333] px-4 py-2 flex items-center justify-between">
    <div class="flex items-center gap-6">
      <NuxtLink to="/" class="text-[#00c853] font-bold text-lg tracking-wider">
        KALMATE⌘
      </NuxtLink>
      <nav class="hidden md:flex gap-4 text-sm">
        <NuxtLink to="/terminal" class="text-[#888] hover:text-white transition-colors flex items-center gap-1 font-sans">
          TERMINAL <span class="text-[#555] text-[10px] font-mono">[1]</span>
        </NuxtLink>
        <NuxtLink to="/terminal/portfolio" class="text-[#888] hover:text-white transition-colors flex items-center gap-1 font-sans">
          PORTFOLIO <span class="text-[#555] text-[10px] font-mono">[2]</span>
        </NuxtLink>
        <NuxtLink to="/terminal/screener" class="text-[#888] hover:text-white transition-colors flex items-center gap-1 font-sans">
          SCREENER <span class="text-[#555] text-[10px] font-mono">[4]</span>
        </NuxtLink>
        <NuxtLink to="/terminal/alerts" class="text-[#888] hover:text-white transition-colors flex items-center gap-1 font-sans">
          ALERTS <span class="text-[#555] text-[10px] font-mono">[3]</span>
        </NuxtLink>
      </nav>
    </div>
    <div class="text-xs text-[#aaa] font-sans">
      <span class="text-[#2979ff]">●</span> LIVE
    </div>
  </header>
</template>
