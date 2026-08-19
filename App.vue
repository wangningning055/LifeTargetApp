<template>
  <view class="app-root">
    <slot />
  </view>
</template>

<style>
.app-root {
  min-height: 100vh;
}

page {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72) 26%, rgba(248, 243, 235, 0.95) 62%),
    linear-gradient(180deg, #f8f3eb 0%, #f2eadf 100%);
  color: #1f2937;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
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
