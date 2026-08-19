<template>
  <view class="empty">
    <view class="orb orb-a"></view>
    <view class="orb orb-b"></view>
    <view class="icon">✦</view>
    <view class="title">{{ title }}</view>
    <view class="desc">{{ desc }}</view>
    <view class="cta" @tap="$emit('create')">{{ buttonText }}</view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '开始规划你的下一段人生旅程',
  },
  desc: {
    type: String,
    default: '先创建一个主目标，再往下拆分成可执行的子目标，最后逐步完成。',
  },
  buttonText: {
    type: String,
    default: '新建第一个目标',
  },
});

defineEmits(['create']);
</script>

<style>
.empty {
  position: relative;
  margin-top: 28rpx;
  padding: 72rpx 40rpx;
  border-radius: 36rpx;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.72));
  border: 1rpx solid rgba(120, 104, 84, 0.12);
  box-shadow: 0 16rpx 44rpx rgba(44, 35, 20, 0.08);
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(8rpx);
  opacity: 0.36;
  animation: float 4.8s ease-in-out infinite;
}

.orb-a {
  width: 180rpx;
  height: 180rpx;
  left: -30rpx;
  top: -20rpx;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.45), rgba(37, 99, 235, 0));
}

.orb-b {
  width: 220rpx;
  height: 220rpx;
  right: -50rpx;
  bottom: -60rpx;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.35), rgba(124, 58, 237, 0));
  animation-delay: -1.8s;
}

.icon {
  width: 90rpx;
  height: 90rpx;
  line-height: 90rpx;
  margin: 0 auto 18rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-size: 42rpx;
  box-shadow: 0 18rpx 36rpx rgba(37, 99, 235, 0.28);
  animation: pulse 2.2s ease-in-out infinite;
}

.title {
  font-size: 34rpx;
  font-weight: 800;
  color: #111827;
}

.desc {
  margin-top: 16rpx;
  color: #6b7280;
  font-size: 26rpx;
  line-height: 1.7;
}

.cta {
  display: inline-block;
  margin-top: 28rpx;
  padding: 22rpx 34rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 16rpx 34rpx rgba(37, 99, 235, 0.24);
  animation: bounceSoft 2.6s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12rpx);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes bounceSoft {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4rpx) scale(1.02);
  }
}
</style>
