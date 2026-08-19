<template>
  <view class='goal-node' :class='{ child: level > 0 }'>
    <view class='card' :class='{ ultimate: goal.isUltimate }' :style="cardStyle">
      <view class='card-head clickable-head' @tap.stop='handleSelect'>
        <view class='title-wrap'>
          <view class='goal-title'>{{ goal.title }}</view>
          <view class='goal-meta'>
            <text v-if='goal.isUltimate' class='meta-pill ultimate-pill'>终极目标</text>
            <text class='meta-pill'>{{ dateRange }}</text>
            <text class='meta-pill purpose-pill'>{{ goal.purpose || '未填写目标目的' }}</text>
          </view>
        </view>

        <view class='head-tools'>
          <view class='status-badge' :style='{ background: statusBg, color: statusColor }'>
            {{ statusLabel }}
          </view>
        </view>
      </view>

      <view class='collapse-trigger detail-trigger' @tap='toggleDetails'>
        <view class='collapse-copy'>
          <text class='collapse-label'>目标详情</text>
          <text class='collapse-desc'>{{ detailsExpanded ? '点击收起内容' : '点击展开内容' }}</text>
        </view>
        <view class='collapse-indicator' :class='{ expanded: detailsExpanded }'>
          <text class='collapse-indicator-text'>{{ detailsExpanded ? '收起' : '展开' }}</text>
          <text class='collapse-arrow'>⌃</text>
        </view>
      </view>

      <transition name='collapse-fade'>
        <view v-if='detailsExpanded' class='card-body'>
          <view v-if='goal.content' class='goal-content'>
            {{ goal.content }}
          </view>

          <view v-if='goal.isUltimate' class='progress-panel'>
            <view class='progress-head'>
              <text class='progress-title'>当前进度</text>
              <text class='progress-badge'>持续更新</text>
            </view>
            <view class='progress-text'>{{ goal.currentProgress || '暂未填写当前进度' }}</view>
          </view>

          <view v-if='goal.status === "completed" && hasCompletionProof' class='completion-proof'>
            <view class='completion-head'>
              <text class='completion-title'>完成记录</text>
              <text class='completion-badge'>已提交凭证</text>
            </view>

            <view v-if='goal.completionNote' class='completion-note'>
              {{ goal.completionNote }}
            </view>

            <scroll-view
              v-if='goal.completionImages && goal.completionImages.length'
              class='completion-images'
              scroll-x='true'
              show-scrollbar='false'
            >
              <view class='completion-image-row'>
                <image
                  v-for='(image, index) in goal.completionImages'
                  :key='image + index'
                  class='completion-image'
                  :src='image'
                  mode='aspectFill'
                  @tap='previewCompletionImages(index)'
                />
              </view>
            </scroll-view>

            <view v-if='goal.completionVideo' class='completion-video-wrap'>
              <video class='completion-video' :src='goal.completionVideo' controls object-fit='cover'></video>
            </view>
          </view>

          <view class='actions'>
            <view class='action-btn primary' @tap='$emit("edit", goal)'>编辑</view>
            <view class='action-btn' @tap='$emit("add-child", goal)'>拆分子目标</view>
            <view class='action-btn danger' @tap='$emit("delete", goal)'>删除</view>
          </view>

          <view class='quick-status'>
            <view class='quick-label'>状态切换</view>
            <view class='status-row'>
              <view
                v-for='option in statusOptions'
                :key='option.value'
                class='status-option'
                :class='{ active: goal.status === option.value }'
                :style='goal.status === option.value ? { borderColor: option.color, color: option.color } : null'
                @tap='$emit("status-change", { goal, status: option.value })'
              >
                {{ option.label }}
              </view>
            </view>
          </view>
        </view>
      </transition>

      <view v-if='goal.children && goal.children.length' class='children-block'>
        <view class='collapse-trigger children-head' @tap='toggleChildren'>
          <view class='collapse-copy'>
            <text class='collapse-label'>子目标列表</text>
            <text class='collapse-desc'>共 {{ goal.children.length }} 项，{{ childrenExpanded ? '点击收起' : '点击展开' }}</text>
          </view>
          <view class='collapse-indicator' :class='{ expanded: childrenExpanded }'>
            <text class='collapse-indicator-text'>{{ childrenExpanded ? '收起' : '展开' }}</text>
            <text class='collapse-arrow'>⌃</text>
          </view>
        </view>

        <transition name='collapse-fade'>
          <view v-if='childrenExpanded' class='children-list'>
            <GoalNode
              v-for='child in goal.children'
              :key='child.id'
              :goal='child'
              :level='level + 1'
              @select='$emit("select", $event)'
              @edit='$emit("edit", $event)'
              @delete='$emit("delete", $event)'
              @add-child='$emit("add-child", $event)'
              @status-change='$emit("status-change", $event)'
            />
          </view>
        </transition>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { GOAL_STATUS_OPTIONS } from '../common/goalConstants';
import { formatDateRange, getStatusMeta, hasGoalCompletionProof } from '../utils/goalUtils';

defineOptions({
  name: 'GoalNode',
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

const emit = defineEmits(['edit', 'delete', 'add-child', 'status-change', 'select']);

const detailsExpanded = ref(true);
const childrenExpanded = ref(true);
const statusOptions = GOAL_STATUS_OPTIONS;
const statusMeta = computed(() => getStatusMeta(props.goal.status));
const statusColor = computed(() => statusMeta.value.color);
const statusBg = computed(() => statusMeta.value.color + '18');
const statusLabel = computed(() => statusMeta.value.label);
const accentColor = computed(() => {
  if (props.goal.isUltimate) {
    return '#7c3aed';
  }
  if (props.goal.status === 'completed') {
    return '#16a34a';
  }
  if (props.goal.status === 'abandoned') {
    return '#dc2626';
  }
  return '#2563eb';
});
const cardStyle = computed(() => ({ '--accent': accentColor.value }));
const dateRange = computed(() => formatDateRange(props.goal.startTime, props.goal.endTime));
const hasCompletionProof = computed(() => hasGoalCompletionProof(props.goal));

function toggleDetails() {
  detailsExpanded.value = !detailsExpanded.value;
}

function toggleChildren() {
  childrenExpanded.value = !childrenExpanded.value;
}

function previewCompletionImages(index) {
  if (!props.goal.completionImages || !props.goal.completionImages.length) {
    return;
  }

  uni.previewImage({
    urls: props.goal.completionImages,
    current: props.goal.completionImages[index],
  });
}

function handleSelect() {
  emit('select', props.goal);
}
</script>

<style>
.goal-node {
  margin-bottom: 24rpx;
}

.card {
  position: relative;
  border-radius: 30rpx;
  padding: 28rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(120, 104, 84, 0.12);
  box-shadow: 0 16rpx 40rpx rgba(44, 35, 20, 0.08);
  animation: cardIn 0.42s cubic-bezier(0.2, 0.85, 0.2, 1);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8rpx;
  background: linear-gradient(90deg, var(--accent), rgba(37, 99, 235, 0.2));
}

.goal-node.child .card {
  background: rgba(255, 255, 255, 0.72);
  margin-left: 24rpx;
}

.card.ultimate {
  background: linear-gradient(135deg, rgba(245, 243, 255, 0.95), rgba(255, 255, 255, 0.92));
  border-color: rgba(124, 58, 237, 0.16);
  box-shadow: 0 18rpx 44rpx rgba(109, 40, 217, 0.12);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.clickable-head {
  padding-bottom: 6rpx;
}

.goal-title {
  font-size: 34rpx;
  line-height: 1.35;
  font-weight: 700;
  color: #111827;
}

.goal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(248, 250, 252, 0.95);
  color: #475569;
  font-size: 22rpx;
}

.purpose-pill {
  color: #6b7280;
}

.ultimate-pill {
  background: rgba(124, 58, 237, 0.12);
  color: #6d28d9;
  font-weight: 700;
}

.head-tools {
  display: flex;
  align-items: flex-end;
  flex-shrink: 0;
}

.status-badge {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.card-body {
  margin-top: 18rpx;
}

.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  border: 1rpx solid rgba(148, 163, 184, 0.18);
}

.collapse-copy {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.collapse-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #1f2937;
}

.collapse-desc {
  font-size: 20rpx;
  color: #64748b;
}

.collapse-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.collapse-indicator-text {
  line-height: 1;
}

.collapse-arrow {
  line-height: 1;
  font-size: 20rpx;
  transform: rotate(180deg);
  transition: transform 0.24s ease;
}

.collapse-indicator.expanded .collapse-arrow {
  transform: rotate(0deg);
}

.goal-content {
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.7;
}

.progress-panel {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(245, 243, 255, 0.92), rgba(237, 233, 254, 0.88));
  border: 1rpx solid rgba(124, 58, 237, 0.16);
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.progress-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #5b21b6;
}

.progress-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.76);
  color: #7c3aed;
  font-size: 20rpx;
}

.progress-text {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #4c1d95;
}

.completion-proof {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.94), rgba(220, 252, 231, 0.88));
  border: 1rpx solid rgba(34, 197, 94, 0.16);
}

.completion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.completion-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #166534;
}

.completion-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  color: #15803d;
  font-size: 20rpx;
}

.completion-note {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #14532d;
}

.completion-images {
  margin-top: 18rpx;
  white-space: nowrap;
}

.completion-image-row {
  display: inline-flex;
  gap: 14rpx;
}

.completion-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.72);
}

.completion-video-wrap {
  margin-top: 18rpx;
}

.completion-video {
  width: 100%;
  height: 320rpx;
  border-radius: 22rpx;
  background: #000;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
  flex-wrap: wrap;
}

.action-btn {
  padding: 16rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(243, 244, 246, 0.95);
  color: #374151;
  font-size: 24rpx;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-btn.primary {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.action-btn.danger {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.quick-status {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx dashed rgba(120, 104, 84, 0.16);
}

.quick-label {
  font-size: 22rpx;
  color: #6b7280;
  margin-bottom: 14rpx;
}

.status-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.status-option {
  padding: 14rpx 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.32);
  background: rgba(248, 250, 252, 0.92);
  color: #475569;
  font-size: 22rpx;
}

.children-block {
  margin-top: 22rpx;
  border-top: 1rpx solid rgba(120, 104, 84, 0.1);
  padding-top: 20rpx;
}

.children-head {
  margin-bottom: 14rpx;
}

.children-list {
  padding-left: 8rpx;
}

.collapse-fade-enter-active,
.collapse-fade-leave-active {
  transition: all 0.24s ease;
  overflow: hidden;
}

.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
  transform: translateY(-10rpx);
}

.card:hover .action-btn,
.card:hover .status-option {
  transform: translateY(-2rpx) scale(1.01);
}

@keyframes cardIn {
  0% {
    opacity: 0;
    transform: translateY(20rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
