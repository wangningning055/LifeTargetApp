<template>
  <view class='goal-node' :class='{ child: level > 0 }' :data-goal-id='goal.id'>
    <view class='card' :class='{ ultimate: goal.isUltimate }' :style="cardStyle">
      <view class='card-head clickable-head' @tap.stop='handleSelect'>
        <view class='title-wrap'>
          <view class='goal-title-row'>
            <view class='goal-title'>{{ goal.title }}</view>
            <text v-if='goal.parentGoalTitle' class='child-goal-tag'>是 {{ goal.parentGoalTitle }} 的子目标</text>
          </view>
          <view class='goal-meta'>
            <text v-if='goal.isUltimate' class='meta-pill ultimate-pill'>终极目标</text>
            <text class='meta-pill'>{{ dateRange }}</text>
            <text class='meta-pill purpose-pill'>{{ goal.purpose || '未填写目标目的' }}</text>
          </view>
          <view v-if='goal.achieveMethod' class='achieve-preview'>
            <text class='achieve-preview-label'>如何达成</text>
            <text class='achieve-preview-text'>{{ goal.achieveMethod }}</text>
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

            <view v-if='goal.purpose' class='detail-panel purpose-panel'>
              <view class='detail-title'>目标目的</view>
              <view class='detail-text'>{{ goal.purpose }}</view>
            </view>

            <view v-if='goal.achieveMethod' class='detail-panel achieve-panel'>
              <view class='detail-title'>如何达成</view>
              <view class='detail-text'>{{ goal.achieveMethod }}</view>
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
              <text class='completion-badge'>已提交成果</text>
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

          <view v-if='hasStageCompletions' class='stage-completion-panel'>
            <view class='stage-completion-header'>
              <text class='stage-completion-title'>阶段性完成列表</text>
              <text class='stage-completion-badge'>{{ goal.stageCompletions.length }} 项保留</text>
            </view>

            <view
              v-for='item in goal.stageCompletions'
              :key='item.id + item.completedAt'
              class='stage-completion-item'
            >
              <view class='stage-completion-item-head'>
                <text class='stage-completion-name'>{{ item.title || '未命名子目标' }}</text>
                <text v-if='item.parentGoalTitle' class='stage-completion-tag'>是 {{ item.parentGoalTitle }} 的子目标</text>
              </view>
              <view v-if='item.purpose' class='stage-completion-text'>目的：{{ item.purpose }}</view>
              <view v-if='item.achieveMethod' class='stage-completion-text'>如何达成：{{ item.achieveMethod }}</view>
              <view v-if='item.completionNote' class='stage-completion-note'>{{ item.completionNote }}</view>
              <view class='stage-completion-meta'>完成于 {{ formatDate(item.completedAt) || '未记录时间' }}</view>
            </view>
          </view>

          <view class='actions'>
            <view v-if='props.showEdit' class='action-btn primary' @tap='$emit("edit", goal)'>编辑</view>
            <view v-if='canAddChild' class='action-btn' @tap='$emit("add-child", goal)'>拆分子目标</view>
            <view v-if='props.showDelete' class='action-btn danger' @tap='$emit("delete", goal)'>删除</view>
          </view>

          <view v-if='showQuickStatus' class='quick-status'>
            <view class='quick-label'>状态操作</view>
            <view class='status-row'>
              <view
                v-if='goal.status === "doing"'
                class='status-option complete'
                @tap='$emit("status-change", { goal, status: "completed" })'
              >
                完成
              </view>
              <view
                v-if='goal.status === "doing"'
                class='status-option abandon'
                @tap='$emit("status-change", { goal, status: "abandoned" })'
              >
                放弃
              </view>
              <view
                v-if='goal.status === "abandoned"'
                class='status-option restart'
                @tap='$emit("status-change", { goal, status: "doing" })'
              >
                重新开始
              </view>
            </view>
          </view>
        </view>
      </transition>

      <view v-if='showChildrenBlock' class='children-block'>
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
              :show-add-child='props.showAddChild'
              :show-edit='props.showEdit'
              :show-delete='props.showDelete'
              :show-status-actions='props.showStatusActions'
              :show-children='props.showChildren'
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
import { formatDate, formatDateRange, getStatusMeta, hasGoalCompletionProof } from '../utils/goalUtils';

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
  showAddChild: {
    type: Boolean,
    default: true,
  },
  showEdit: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
  showStatusActions: {
    type: Boolean,
    default: true,
  },
  showChildren: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['edit', 'delete', 'add-child', 'status-change', 'select']);

const detailsExpanded = ref(true);
const childrenExpanded = ref(true);
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
const hasStageCompletions = computed(() => Array.isArray(props.goal.stageCompletions) && props.goal.stageCompletions.length > 0);
const canAddChild = computed(() => props.showAddChild && !props.goal.parentId);
const showQuickStatus = computed(() => props.showStatusActions && (props.goal.status === 'doing' || props.goal.status === 'abandoned'));
const showChildrenBlock = computed(() => props.showChildren && props.goal.children && props.goal.children.length);

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
  border-radius: var(--app-radius-md, 30rpx);
  padding: 28rpx;
  overflow: hidden;
  background: var(--theme-board-bg, rgba(255, 255, 255, 0.88));
  border: 1rpx solid var(--theme-board-border, rgba(120, 104, 84, 0.12));
  box-shadow: var(--theme-board-shadow, 0 16rpx 40rpx rgba(44, 35, 20, 0.08));
  backdrop-filter: blur(var(--app-blur-soft, 12px));
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
  background: var(--theme-board-sub-bg, rgba(255, 255, 255, 0.72));
  margin-left: 24rpx;
  animation: childCardIn 0.42s var(--app-ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
}

.card.ultimate {
  background: var(--theme-ultimate-board-bg, linear-gradient(135deg, rgba(245, 243, 255, 0.95), rgba(255, 255, 255, 0.92)));
  border-color: rgba(124, 58, 237, 0.16);
  box-shadow: 0 18rpx 44rpx rgba(109, 40, 217, 0.12);
}

.card:active {
  transform: scale(0.992);
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
  color: var(--theme-card-title, #111827);
}

.goal-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.child-goal-tag {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  font-size: 20rpx;
  font-weight: 700;
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
  background: var(--theme-chip-bg, rgba(248, 250, 252, 0.95));
  color: var(--theme-card-text, #475569);
  font-size: 22rpx;
}

.purpose-pill {
  color: var(--theme-muted-text, #6b7280);
}

.achieve-preview {
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  background: var(--theme-board-strong-bg, linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(224, 242, 254, 0.86)));
  border: 1rpx solid rgba(59, 130, 246, 0.14);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.achieve-preview-label {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #1d4ed8;
}

.achieve-preview-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-card-text, #334155);
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
  border-radius: var(--app-radius-sm, 24rpx);
  background: var(--theme-board-sub-bg, linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92)));
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.collapse-trigger:active {
  transform: translateX(10rpx) scale(0.99);
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
  color: var(--theme-card-title, #1f2937);
}

.collapse-desc {
  font-size: 20rpx;
  color: var(--theme-muted-text, #64748b);
}

.collapse-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.92));
  color: var(--theme-chip-text, #334155);
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
  backdrop-filter: blur(var(--app-blur-soft, 12px));
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
  color: var(--theme-card-text, #4b5563);
  font-size: 26rpx;
  line-height: 1.7;
}

.detail-panel {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.purpose-panel {
  background: var(--theme-plain-bg, rgba(248, 250, 252, 0.9));
  border: 1rpx solid rgba(148, 163, 184, 0.16);
}

.achieve-panel {
  background: var(--theme-board-strong-bg, linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(224, 242, 254, 0.88)));
  border: 1rpx solid rgba(59, 130, 246, 0.16);
}

.detail-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--theme-card-title, #1f2937);
}

.detail-text {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-card-text, #475569);
}

.progress-panel {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  background: var(--theme-board-strong-bg, linear-gradient(135deg, rgba(245, 243, 255, 0.92), rgba(237, 233, 254, 0.88)));
  border: 1rpx solid rgba(124, 58, 237, 0.16);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
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
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.76));
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
  border-radius: var(--app-radius-sm, 24rpx);
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.94), rgba(220, 252, 231, 0.88));
  border: 1rpx solid rgba(34, 197, 94, 0.16);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
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
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.72));
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
  border-radius: var(--app-radius-xs, 20rpx);
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.72));
}

.completion-video-wrap {
  margin-top: 18rpx;
}

.completion-video {
  width: 100%;
  height: 320rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  background: #000;
}

.stage-completion-panel {
  margin-top: 20rpx;
  padding: 22rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.94), rgba(255, 237, 213, 0.88));
  border: 1rpx solid rgba(249, 115, 22, 0.16);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.stage-completion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.stage-completion-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #9a3412;
}

.stage-completion-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.72));
  color: #c2410c;
  font-size: 20rpx;
}

.stage-completion-item {
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: var(--app-radius-xs, 20rpx);
  background: var(--theme-chip-bg, rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.stage-completion-item-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
}

.stage-completion-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #7c2d12;
}

.stage-completion-tag {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(251, 146, 60, 0.14);
  color: #c2410c;
  font-size: 20rpx;
}

.stage-completion-text,
.stage-completion-note,
.stage-completion-meta {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.7;
}

.stage-completion-text {
  color: #7c2d12;
}

.stage-completion-note {
  color: #9a3412;
}

.stage-completion-meta {
  color: #c2410c;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
  flex-wrap: wrap;
}

.action-btn {
  padding: 16rpx 20rpx;
  border-radius: var(--app-radius-xs, 18rpx);
  background: var(--theme-chip-bg, rgba(243, 244, 246, 0.95));
  color: var(--theme-chip-text, #374151);
  font-size: 24rpx;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.action-btn.primary {
  background: var(--theme-primary-soft-bg, rgba(37, 99, 235, 0.1));
  color: var(--theme-primary-soft-text, #1d4ed8);
}

.action-btn.danger {
  background: var(--theme-danger-bg, rgba(220, 38, 38, 0.1));
  color: var(--theme-danger-text, #b91c1c);
}

.quick-status {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx dashed rgba(120, 104, 84, 0.16);
}

.quick-label {
  font-size: 22rpx;
  color: var(--theme-muted-text, #6b7280);
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
  background: var(--theme-chip-bg, rgba(248, 250, 252, 0.92));
  color: var(--theme-card-text, #475569);
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.status-option.complete {
  color: var(--theme-success-text, #166534);
  border-color: var(--theme-success-border, rgba(34, 197, 94, 0.24));
  background: var(--theme-success-bg, rgba(240, 253, 244, 0.96));
}

.status-option.abandon {
  color: var(--theme-danger-text, #b91c1c);
  border-color: var(--theme-danger-border, rgba(239, 68, 68, 0.24));
  background: var(--theme-danger-bg, rgba(254, 242, 242, 0.96));
}

.status-option.restart {
  color: var(--theme-primary-soft-text, #1d4ed8);
  border-color: var(--theme-primary-soft-border, rgba(59, 130, 246, 0.24));
  background: var(--theme-primary-soft-bg, rgba(239, 246, 255, 0.96));
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
  animation: slideChildrenIn 0.34s var(--app-ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
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

.action-btn:active,
.status-option:active {
  transform: translateY(3rpx) scale(0.97);
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

@keyframes childCardIn {
  0% {
    opacity: 0;
    transform: translateX(-20rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slideChildrenIn {
  0% {
    opacity: 0;
    transform: translateY(-14rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
