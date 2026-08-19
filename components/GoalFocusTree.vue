<template>
  <view class="focus-tree-node" :class="{ child: level > 0 }" @tap.stop="emitSelect(goal)">
    <view class="focus-tree-header">
      <view class="focus-tree-copy">
        <view class="focus-tree-title-row">
          <text class="focus-tree-title">{{ goal.title }}</text>
          <text v-if="level === 0" class="focus-tree-root-tag">主目标</text>
          <text v-else class="focus-tree-child-tag">子目标</text>
        </view>
        <view class="focus-tree-summary">{{ goal.purpose || goal.content || '点击查看详情、编辑内容与目标进展。' }}</view>
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

    <view v-if="goal.children && goal.children.length" class="focus-tree-children">
      <GoalFocusTree
        v-for="child in goal.children"
        :key="child.id"
        :goal="child"
        :level="level + 1"
        @select="emit('select', $event)"
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

const emit = defineEmits(['select']);

const statusMeta = computed(() => getStatusMeta(props.goal.status));
const statusStyle = computed(() => ({
  color: statusMeta.value.color,
  background: `${statusMeta.value.color}18`,
}));

function emitSelect(goal) {
  emit('select', goal);
}
</script>

<style>
.focus-tree-node {
  padding: 24rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
}

.focus-tree-node.child {
  margin-top: 16rpx;
  margin-left: 28rpx;
  background: rgba(248, 250, 252, 0.92);
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
  color: #111827;
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
  color: #475569;
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

.focus-tree-metric {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(241, 245, 249, 0.88);
}

.metric-label {
  font-size: 20rpx;
  color: #64748b;
}

.metric-value {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #111827;
}

.metric-value.emphasis {
  color: #7c3aed;
}

.focus-tree-children {
  margin-top: 18rpx;
}
</style>
