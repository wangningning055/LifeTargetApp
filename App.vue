<template>
  <view class="app-root">
    <slot />
  </view>
</template>

<style>
:root {
  --app-radius-xs: 18rpx;
  --app-radius-sm: 24rpx;
  --app-radius-md: 30rpx;
  --app-radius-lg: 36rpx;
  --app-radius-xl: 44rpx;
  --app-blur-soft: 0px;
  --app-blur-strong: 0px;
  --app-ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --app-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --app-duration-fast: 0.22s;
  --app-duration-base: 0.34s;
  --app-duration-slow: 0.48s;
}

.app-root {
  min-height: 100vh;
}

page {
  --app-safe-top: 0px;
  --app-safe-bottom: 0px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72) 26%, rgba(248, 243, 235, 0.95) 62%),
    linear-gradient(180deg, #f8f3eb 0%, #f2eadf 100%);
  color: #1f2937;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

@supports (top: env(safe-area-inset-top)) {
  page {
    --app-safe-top: env(safe-area-inset-top);
    --app-safe-bottom: env(safe-area-inset-bottom);
  }
}

@supports (top: constant(safe-area-inset-top)) {
  page {
    --app-safe-top: constant(safe-area-inset-top);
    --app-safe-bottom: constant(safe-area-inset-bottom);
  }
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

button,
input,
textarea {
  font: inherit;
}

button {
  margin: 0;
}
</style>
