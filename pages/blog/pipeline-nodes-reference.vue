<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>July 5, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Reference</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">All 21 Pipeline Nodes Explained: When to Use Each</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Kalmate's Pipeline has <strong class="text-white">21 node types</strong> across 3 categories: <strong class="text-[#2979ff]">Input</strong> (4), <strong class="text-[#00c853]">Process</strong> (13), and <strong class="text-[#ff69b4]">Output</strong> (4). This guide covers each node with what it does, its inputs, outputs and parameters.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Free vs Pro</h2>
        <p><strong class="text-[#00c853]">Free</strong> nodes (17 types) cover the basics: symbols, prices, Kalman filter, z-score, rebasing, fundamentals, fair value, charts and display.</p>
        <p><strong class="text-[#ff69b4]">Pro</strong> nodes (4 types) add SMA, EMA, RSI and Forecast. $9.990 CLP once, forever.</p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">INPUT NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">1. Currency <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Pick two currencies (for example USD to CLP). Connect it to Price Feed to get the exchange-rate history.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> none. <span class="text-white">Outputs:</span> Symbol. <span class="text-white">Parameters:</span> From and To currencies (default USD to CLP).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">2. Number <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">A constant number, such as a weight, threshold or coefficient, to feed into calculations.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> none. <span class="text-white">Outputs:</span> Number. <span class="text-white">Parameters:</span> Value (default 1).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">3. Symbol <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">The ticker to analyze, such as AAPL or GOOGL. Start here for any stock pipeline.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> none. <span class="text-white">Outputs:</span> Symbol. <span class="text-white">Parameters:</span> Ticker (default AAPL).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">4. Price Feed <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches the latest price and up to 5 years of daily history for a symbol. The source of all price data.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Symbol. <span class="text-white">Outputs:</span> Price, Price Series, Candle Series. <span class="text-white">Parameters:</span> None.</p>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PROCESS NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">5. SMA <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Simple Moving Average: the average of the last N closes. Shows the general trend direction. The first N-1 days have no value and are left out.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> SMA (series). <span class="text-white">Parameters:</span> Period in days (2 to 400, default 20).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">6. EMA <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Exponential Moving Average: like SMA but weights recent prices more, so it reacts faster to trend changes. The first N-1 days are left out.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> EMA (series). <span class="text-white">Parameters:</span> Period in days (2 to 400, default 20).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">7. RSI <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Relative Strength Index (Wilder): momentum on a 0 to 100 scale. Above 70 is often read as overbought, below 30 as oversold.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> RSI (latest value), RSI Series. <span class="text-white">Parameters:</span> Period in days (2 to 100, default 14).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">8. Forecast <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Projects the price forward with the chosen model and a 95% band. It also reports how that model did against the &quot;no change&quot; forecast on this asset&#x27;s own past. An estimate, not a trading signal and not a promise of returns.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> Forecast (series with band), Expected Return, Skill vs No Change. <span class="text-white">Parameters:</span> Model (Auto, Trend, Autoregressive, Mean reversion; default Auto) and horizon in days (5 to 252, default 30).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">9. Kalman Filter <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Smooths the price with a local-trend Kalman filter to estimate its underlying level. Deviation is how far the price sits from that level; the signal is +1 when the price is below the level and -1 when above.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> Smoothed (series), Deviation % (series), Signal. <span class="text-white">Parameters:</span> Smoothing (Responsive, Balanced default, Smooth).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">10. Z-Score <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">How many standard deviations the log price sits from its own rolling mean. Below -2 is cheap against its own history, above +2 is expensive.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> Z-Score Series, Z-Score (latest value). <span class="text-white">Parameters:</span> Window in days (20 to 1260, default 252).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">11. Rebase to 100 <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Rebases the price to 100 at the start of the chosen window, so assets with different prices can be compared on one chart. Also reports the change over the window.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series. <span class="text-white">Outputs:</span> Rebased Series, Change %. <span class="text-white">Parameters:</span> Window: 1M, 3M, 6M, 1Y (default), 2Y or ALL.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">12. Fundamentals <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Company fundamentals (EPS, book value and free cash flow per share, net income, coverage) as publicly known on a given date. US-listed tickers only.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Symbol. <span class="text-white">Outputs:</span> EPS (TTM), Book Value / Share, FCF / Share, Net Income (TTM), Free Cash Flow, Shares Outstanding, Coverage. <span class="text-white">Parameters:</span> As of (optional date; empty means latest).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">13. Fair Value <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">A valuation reference: applies the company&#x27;s own historical P/E and P/B multiples to today&#x27;s earnings and book value. Upside compares that estimate with the current price. It is not a forecast. US-listed tickers only.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Symbol, Price Series. <span class="text-white">Outputs:</span> Fair Value, Upside %, P/E (TTM), P/B, Fair Value Series. <span class="text-white">Parameters:</span> None.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">14. Compare to Reference <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Labels the price Undervalued or Overvalued against a reference (fair value, a target, another price) within a tolerance band, with the percentage gap. Descriptive only, not a buy or sell recommendation.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Price Series, Reference Value. <span class="text-white">Outputs:</span> Undervalued (signal), Overvalued (signal), Difference %, Position. <span class="text-white">Parameters:</span> Tolerance in percent points (0 to 50, default 2).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">15. Math <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Combines two values with +, -, × or ÷. Works on numbers, arrays and time series (series are matched by date).</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> A, B (any). <span class="text-white">Outputs:</span> Result. <span class="text-white">Parameters:</span> Operation (+, -, ×, ÷).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">16. Weighted Average <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Weighted average of several inputs, such as signals from different indicators. Start with two inputs and add more as needed.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Input 1, Input 2, ... (any). <span class="text-white">Outputs:</span> Weighted Average. <span class="text-white">Parameters:</span> Weight per input (default 1).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">17. News <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches the latest headlines for the symbol and scores their tone; higher values read as more positive. Useful as context next to the price, not as a signal on its own.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Symbol. <span class="text-white">Outputs:</span> Sentiment, Articles. <span class="text-white">Parameters:</span> None.</p>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#ff69b4] text-sm font-mono tracking-widest mb-3">OUTPUT NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">18. Chart <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Plots connected series on a line chart with a date axis. Connect the price as the main series; indicators, forecasts and fair value go to the overlays. Secondary-scale series such as RSI and Z-Score are drawn in a panel below.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Main Series, Overlay A, Overlay B, Overlay C. <span class="text-white">Outputs:</span> None. <span class="text-white">Parameters:</span> None.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">19. Candle Chart <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Japanese candlestick chart of open, high, low and close. Overlays are drawn over the candles, aligned by date.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Candle Series, Overlay A, Overlay B, Overlay C. <span class="text-white">Outputs:</span> None. <span class="text-white">Parameters:</span> None.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">20. Display <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Shows a single value: a number formatted by its unit, or text. Connect the output of an indicator, calculation or input.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Value (any). <span class="text-white">Outputs:</span> None. <span class="text-white">Parameters:</span> None.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">21. Alert <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Checks a value against a threshold and reports whether the alert is Triggered or Watching. It only shows the result in the editor; it does not send notifications.</p>
              <p class="text-[#888] text-xs mt-2"><span class="text-white">Inputs:</span> Value (any). <span class="text-white">Outputs:</span> None. <span class="text-white">Parameters:</span> Trigger when (above or below the threshold, default above), threshold (default 0).</p>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Quick Decision Guide</h2>
        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <div class="space-y-3 text-sm [&>p]:flex [&>p]:gap-2">
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Watch one price:</strong><span class="text-[#ccc]">Symbol → Price Feed → Chart</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Smooth noisy data:</strong><span class="text-[#ccc]">Symbol → Price Feed → Kalman Filter (Smoothed) → Chart overlay</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Track trend:</strong><span class="text-[#ccc]">Symbol → Price Feed → SMA or EMA → Chart</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Spot stretched prices:</strong><span class="text-[#ccc]">Symbol → Price Feed → Z-Score → Alert (trigger below -2)</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Compare two assets:</strong><span class="text-[#ccc]">Symbol → Price Feed → Rebase to 100, for each asset, into one Chart</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Check valuation:</strong><span class="text-[#ccc]">Symbol and Price Feed → Fair Value → Display (Upside %)</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Project the price:</strong><span class="text-[#ccc]">Price Feed → Forecast → Chart overlay, and Expected Return → Display</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Combine signals:</strong><span class="text-[#ccc]">RSI and Z-Score → Weighted Average → Display</span></p>
          </div>
        </div>

        <p class="mt-8">
          Ready to build? <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Open the Pipeline Editor</NuxtLink>. Start with the <NuxtLink to="/blog/first-pipeline-tutorial" class="text-[#00c853] hover:underline">Beginner Tutorial</NuxtLink> if you haven't yet.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'All 21 Pipeline Nodes Explained — Kalmate Reference Guide',
  meta: [
    { name: 'description', content: 'Complete Kalmate pipeline node reference. 21 nodes across 3 categories: Input (4), Process (13), and Output (4). Inputs, outputs, parameters and use cases for each node, plus the Free and Pro split.' },
    { name: 'keywords', content: 'kalmate pipeline nodes, pipeline reference, kalmate node types, symbol, price feed, kalman filter, RSI, SMA, EMA, forecast, z-score, fair value, rebase to 100, weighted average, alert' },
  ],
})
</script>
