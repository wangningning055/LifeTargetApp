<template>
  <view class="focus-tree-node" :class="{ child: level > 0 }" :data-goal-id="goal.id" @tap.stop="emitSelect(goal)">
    <view class="focus-tree-header">
      <view class="focus-tree-copy">
        <view class="focus-tree-title-row">
          <text class="focus-tree-title">{{ goal.title }}</text>
          <text v-if="level === 0" class="focus-tree-root-tag">主目标</text>
          <text v-else class="focus-tree-child-tag">子目标</text>
        </view>
        <view class="focus-tree-summary">{{ goal.purpose || goal.achieveMethod || goal.content || '点击查看详情、编辑内容与目标进展。' }}</view>
      </view>
      <view class="focus-tree-status" :style="statusStyle">{{ statusMeta.label }}</view>
    </view>

    <view class="focus-tree-metrics">
      <view class="focus-tree-metric">
        <text class="metric-label">到期时间</text>
        <text class="metric-value">{{ formatDate(goal.endTime) }}</text>
      </view>
      <view class="focus-tree-metric">
        <text class="metric-label">剩余时间</text>
        <text class="metric-value emphasis">{{ formatRemainingTime(goal.endTime) }}</text>
      </view>
    </view>

    <view v-if="goal.achieveMethod" class="focus-tree-achieve">
      <text class="focus-tree-achieve-label">如何达成</text>
      <text class="focus-tree-achieve-text">{{ goal.achieveMethod }}</text>
    </view>

    <view class="focus-tree-actions" @tap.stop>
      <view
        v-if="goal.status === 'doing'"
        class="focus-tree-action complete"
        @tap.stop="emitStatusChange('completed')"
      >
        完成
      </view>
      <view
        v-if="goal.status === 'doing'"
        class="focus-tree-action abandon"
        @tap.stop="emitStatusChange('abandoned')"
      >
        放弃
      </view>
      <view
        v-if="goal.status === 'abandoned'"
        class="focus-tree-action restart"
        @tap.stop="emitStatusChange('doing')"
      >
        重新开始
      </view>
    </view>

    <view v-if="goal.children && goal.children.length" class="focus-tree-children">
      <GoalFocusTree
        v-for="child in goal.children"
        :key="child.id"
        :goal="child"
        :level="level + 1"
        @select="emit('select', $event)"
        @status-change="emit('status-change', $event)"
      />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate, formatRemainingTime, getStatusMeta } from '../utils/goalUtils';

defineOptions({
  name: 'GoalFocusTree',
});

const props = defineProps({
  goal: {
    type: Object,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['select', 'status-change']);

const statusMeta = computed(() => getStatusMeta(props.goal.status));
const statusStyle = computed(() => ({
  color: statusMeta.value.color,
  background: `${statusMeta.value.color}18`,
}));

function emitSelect(goal) {
  emit('select', goal);
}

function emitStatusChange(status) {
  emit('status-change', {
    goal: props.goal,
    status,
  });
}
</script>

<style>
.focus-tree-node {
  padding: 24rpx;
  border-radius: var(--app-radius-sm, 26rpx);
  background: var(--theme-board-bg, rgba(255, 255, 255, 0.86));
  border: 1rpx solid var(--theme-board-border, rgba(148, 163, 184, 0.16));
  backdrop-filter: blur(var(--app-blur-soft, 12px));
  animation: focusNodeIn 0.4s var(--app-ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
}

.focus-tree-node.child {
  margin-top: 16rpx;
  margin-left: 28rpx;
  background: var(--theme-board-sub-bg, rgba(248, 250, 252, 0.92));
  animation: focusChildIn 0.38s var(--app-ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
}

.focus-tree-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.focus-tree-copy {
  min-width: 0;
  flex: 1;
}

.focus-tree-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.focus-tree-title {
  font-size: 30rpx;
  line-height: 1.35;
  font-weight: 800;
  color: var(--theme-card-title, #111827);
}

.focus-tree-root-tag,
.focus-tree-child-tag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.focus-tree-root-tag {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.1);
}

.focus-tree-child-tag {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

.focus-tree-summary {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-card-text, #475569);
}

.focus-tree-status {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.focus-tree-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.focus-tree-achieve {
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: var(--app-radius-sm, 22rpx);
  background: var(--theme-board-strong-bg, linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(224, 242, 254, 0.86)));
  border: 1rpx solid rgba(59, 130, 246, 0.14);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.focus-tree-achieve-label {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #1d4ed8;
}

.focus-tree-achieve-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-card-text, #334155);
}

.focus-tree-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
}

.focus-tree-action {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  border: 1rpx solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
  box-shadow: 0 10rpx 22rpx rgba(15, 23, 42, 0.05);
}

.focus-tree-action.complete {
  color: var(--theme-success-text, #166534);
  background: var(--theme-success-bg, rgba(240, 253, 244, 0.96));
  border-color: var(--theme-success-border, rgba(34, 197, 94, 0.22));
}

.focus-tree-action.abandon {
  color: var(--theme-danger-text, #b91c1c);
  background: var(--theme-danger-bg, rgba(254, 242, 242, 0.96));
  border-color: var(--theme-danger-border, rgba(239, 68, 68, 0.22));
}

.focus-tree-action.restart {
  color: var(--theme-primary-soft-text, #1d4ed8);
  background: var(--theme-primary-soft-bg, rgba(239, 246, 255, 0.96));
  border-color: var(--theme-primary-soft-border, rgba(59, 130, 246, 0.22));
}

.focus-tree-metric {
  padding: 18rpx 20rpx;
  border-radius: var(--app-radius-sm, 22rpx);
  background: var(--theme-board-sub-bg, rgba(241, 245, 249, 0.88));
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.metric-label {
  font-size: 20rpx;
  color: var(--theme-muted-text, #64748b);
}

.metric-value {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--theme-card-title, #111827);
}

.metric-value.emphasis {
  color: #7c3aed;
}

.focus-tree-children {
  margin-top: 18rpx;
}

.focus-tree-node:active,
.focus-tree-action:active {
  transform: scale(0.985);
}

@keyframes focusNodeIn {
  0% {
    opacity: 0;
    transform: translateY(18rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes focusChildIn {
  0% {
    opacity: 0;
    transform: translateX(18rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
