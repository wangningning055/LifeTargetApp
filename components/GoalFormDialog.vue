<template>
  <view v-if="visible" class="mask" @touchmove.stop.prevent>
    <view class="panel animate-pop">
      <view class="panel-head">
        <view>
          <view class="title">{{ dialogTitle }}</view>
          <view class="subtitle">{{ dialogSubtitle }}</view>
        </view>
        <view class="close-btn" @tap="close">×</view>
      </view>

      <scroll-view scroll-y="true" class="panel-body">
        <view v-if="props.mode === 'complete'" class="complete-summary">
          <view class="complete-card">
            <view class="complete-name">{{ form.title || '当前目标' }}</view>
            <view class="complete-text">标记为已完成前，需要补充完成描述、照片或视频，至少填写一项。</view>
          </view>
        </view>

        <view v-else-if="showUltimateSummary" class="ultimate-summary">
          <view class="ultimate-card">
            <view class="ultimate-name">{{ form.title || '终极目标' }}</view>
            <view class="ultimate-text">终极目标全局只允许设置一个，后续入口会直接进入编辑模式。</view>
          </view>
        </view>

        <template v-if="props.mode !== 'complete'">
          <view class="field">
            <text class="label">目标标题</text>
            <input v-model="form.title" class="input" maxlength="50" placeholder="例如：完成年度职业转型" />
          </view>

          <view class="field">
            <text class="label">目标内容</text>
            <textarea v-model="form.content" class="textarea" maxlength="500" placeholder="描述这个目标要做什么，越具体越好" />
          </view>

          <view class="field">
            <text class="label">目标目的</text>
            <textarea v-model="form.purpose" class="textarea purpose" maxlength="500" placeholder="为什么要做这个目标，它会带来什么改变" />
          </view>

          <view class="field">
            <text class="label">如何达成</text>
            <textarea
              v-model="form.achieveMethod"
              class="textarea achieve-method"
              maxlength="1000"
              placeholder="拆解实现路径、关键动作或执行方法，例如：每周复盘一次、每天投入 2 小时、分三个阶段推进"
            />
          </view>

          <view v-if="showUltimateFields" class="field">
            <text class="label">当前进度</text>
            <textarea
              v-model="form.currentProgress"
              class="textarea progress-textarea"
              maxlength="1000"
              placeholder="例如：已完成 60%，已完成方案设计，正在推进执行阶段"
            />
          </view>

          <view class="grid">
            <view class="field half">
              <text class="label">开始时间</text>
              <picker mode="date" :value="form.startTime" @change="onDateChange('startTime', $event)">
                <view class="picker">{{ form.startTime || "请选择开始时间" }}</view>
              </picker>
            </view>

            <view class="field half">
              <text class="label">结束时间</text>
              <picker mode="date" :value="form.endTime" @change="onDateChange('endTime', $event)">
                <view class="picker">{{ form.endTime || "请选择结束时间" }}</view>
              </picker>
            </view>
          </view>

        </template>

        <view v-if="showCompletionFields" class="field proof-field">
          <view class="proof-head">
            <text class="label">完成成果</text>
            <text class="proof-tip">完成时至少填写描述、照片或视频中的一项</text>
          </view>

          <textarea
            v-model="form.completionNote"
            class="textarea completion-textarea"
            maxlength="1000"
            placeholder="填写完成描述，例如：过程总结、最终成果、达成结果"
          />

          <view class="proof-actions">
            <view class="proof-btn" @tap="chooseCompletionImages">添加照片</view>
            <view class="proof-btn" @tap="chooseCompletionVideo">添加视频</view>
          </view>

          <view v-if="form.completionImages.length" class="proof-image-grid">
            <view
              v-for="(image, index) in form.completionImages"
              :key="image + index"
              class="proof-image-item"
            >
              <image class="proof-image" :src="image" mode="aspectFill" @tap="previewCompletionImage(index)" />
              <view class="proof-remove" @tap="removeCompletionImage(index)">×</view>
            </view>
          </view>

          <view v-if="form.completionVideo" class="proof-video-card">
            <video class="proof-video" :src="form.completionVideo" controls object-fit="cover"></video>
            <view class="proof-remove video-remove" @tap="clearCompletionVideo">×</view>
          </view>
        </view>
      </scroll-view>

      <view class="panel-footer">
        <view class="ghost-btn" @tap="close">取消</view>
        <view class="primary-btn bounce-btn" @tap="handleSave">{{ submitText }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { DEFAULT_GOAL_FORM } from "../common/goalConstants";
import { hasGoalCompletionProof } from "../utils/goalUtils";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "create",
  },
  initialValue: {
    type: Object,
    default: () => ({}),
  },
  parentGoalTitle: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "save"]);

const form = reactive({
  ...DEFAULT_GOAL_FORM,
});

const showUltimateFields = computed(() => props.mode === "ultimate" || Boolean(form.isUltimate));
const showUltimateSummary = computed(() => props.mode === "ultimate");

const dialogTitle = computed(() => {
  if (props.mode === "complete") {
    return "完成目标";
  }
  if (props.mode === "ultimate") {
    return props.initialValue && props.initialValue.id ? "编辑终极目标" : "设置终极目标";
  }
  if (props.mode === "edit") {
    return "编辑目标";
  }
  if (props.mode === "child") {
    return "新增子目标";
  }
  return "新建目标";
});

const dialogSubtitle = computed(() => {
  if (props.mode === "complete") {
    return "补充完成成果后，才能把目标标记为已完成";
  }
  if (props.mode === "ultimate") {
    return "终极目标全局仅允许一个，并可持续记录当前进度";
  }
  if (props.parentGoalTitle) {
    return `当前拆分自：${props.parentGoalTitle}`;
  }
  return "记录你的主目标与子目标";
});

const submitText = computed(() => {
  if (props.mode === "complete") {
    return "确认完成";
  }
  if (props.mode === "ultimate") {
    return props.initialValue && props.initialValue.id ? "保存终极目标" : "创建终极目标";
  }
  if (props.mode === "edit") {
    return "保存修改";
  }
  return "确认创建";
});

const showCompletionFields = computed(() => props.mode === "complete" || form.status === "completed");

function syncForm() {
  const nextValue = {
    ...DEFAULT_GOAL_FORM,
    ...(props.initialValue || {}),
  };

  Object.assign(form, nextValue, {
    isUltimate: Boolean(nextValue.isUltimate),
    achieveMethod: nextValue.achieveMethod || "",
    currentProgress: nextValue.currentProgress || "",
    completionNote: nextValue.completionNote || "",
    completionImages: Array.isArray(nextValue.completionImages) ? nextValue.completionImages.slice() : [],
    completionVideo: nextValue.completionVideo || "",
  });

  if (props.mode === "complete") {
    form.status = "completed";
  }

  if (props.mode === "ultimate") {
    form.isUltimate = true;
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      syncForm();
    }
  },
  { immediate: true }
);

function close() {
  emit("close");
}

function onDateChange(field, event) {
  form[field] = event.detail.value;
}

function chooseCompletionImages() {
  const remainCount = Math.max(0, 9 - form.completionImages.length);
  if (!remainCount) {
    uni.showToast({ title: "最多添加 9 张照片", icon: "none" });
    return;
  }

  uni.chooseImage({
    count: remainCount,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const files = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [];
      form.completionImages = [...form.completionImages, ...files].slice(0, 9);
    },
  });
}

function removeCompletionImage(index) {
  form.completionImages.splice(index, 1);
}

function previewCompletionImage(index) {
  if (!form.completionImages.length) {
    return;
  }

  uni.previewImage({
    urls: form.completionImages,
    current: form.completionImages[index],
  });
}

function chooseCompletionVideo() {
  uni.chooseVideo({
    sourceType: ["album", "camera"],
    compressed: true,
    maxDuration: 120,
    success: (res) => {
      form.completionVideo = res.tempFilePath || "";
    },
  });
}

function clearCompletionVideo() {
  form.completionVideo = "";
}

function handleSave() {
  const title = form.title.trim();
  if (props.mode !== "complete" && !title) {
    uni.showToast({ title: "请先填写目标标题", icon: "none" });
    return;
  }

  if (form.startTime && form.endTime && form.startTime > form.endTime) {
    uni.showToast({ title: "结束时间不能早于开始时间", icon: "none" });
    return;
  }

  const nextStatus = props.mode === "complete" ? "completed" : form.status;
  const completionPayload = {
    completionNote: form.completionNote.trim(),
    completionImages: form.completionImages.slice(),
    completionVideo: form.completionVideo,
  };

  if (nextStatus === "completed" && !hasGoalCompletionProof(completionPayload)) {
    uni.showToast({ title: "完成目标时请填写描述、照片或视频", icon: "none" });
    return;
  }

  const normalizedCompletion = nextStatus === "completed"
    ? completionPayload
    : {
        completionNote: "",
        completionImages: [],
        completionVideo: "",
      };

  emit("save", {
    title: title || form.title,
    content: form.content.trim(),
    purpose: form.purpose.trim(),
    achieveMethod: form.achieveMethod.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    status: nextStatus,
    isUltimate: props.mode === "ultimate" || Boolean(form.isUltimate),
    currentProgress: showUltimateFields.value ? form.currentProgress.trim() : "",
    ...normalizedCompletion,
  });
}
</script>

<style>
.mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 28rpx;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: none;
  animation: maskFadeIn 0.24s ease;
}

.panel {
  width: 100%;
  max-width: 720rpx;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--app-radius-xl, 34rpx);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 30rpx 90rpx rgba(47, 36, 20, 0.22);
  overflow: hidden;
  backdrop-filter: blur(var(--app-blur-strong, 20px));
}

.panel-head,
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx;
}

.panel-head {
  border-bottom: 1rpx solid rgba(120, 104, 84, 0.12);
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 50%;
  text-align: center;
  font-size: 36rpx;
  color: #6b7280;
  background: rgba(243, 244, 246, 0.8);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.panel-body {
  height: 66vh;
  padding: 0 28rpx 12rpx;
  box-sizing: border-box;
}

.field {
  margin-top: 24rpx;
}

.complete-summary {
  margin-top: 24rpx;
}

.ultimate-summary {
  margin-top: 24rpx;
}

.complete-card {
  padding: 24rpx;
  border-radius: var(--app-radius-sm, 26rpx);
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.92), rgba(220, 252, 231, 0.9));
  border: 1rpx solid rgba(34, 197, 94, 0.18);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.ultimate-card {
  padding: 24rpx;
  border-radius: var(--app-radius-sm, 26rpx);
  background: linear-gradient(135deg, rgba(245, 243, 255, 0.95), rgba(237, 233, 254, 0.92));
  border: 1rpx solid rgba(124, 58, 237, 0.18);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.complete-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #14532d;
}

.ultimate-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #5b21b6;
}

.complete-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #166534;
}

.ultimate-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d28d9;
}

.label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #374151;
  font-weight: 600;
}

.input,
.textarea,
.picker {
  width: 100%;
  border-radius: var(--app-radius-sm, 24rpx);
  border: 1rpx solid rgba(120, 104, 84, 0.16);
  background: rgba(255, 255, 255, 0.82);
  padding: 22rpx 24rpx;
  color: #111827;
  box-sizing: border-box;
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.input {
  height: 92rpx;
}

.textarea {
  min-height: 170rpx;
  line-height: 1.6;
}

.textarea.purpose {
  min-height: 150rpx;
}

.textarea.achieve-method {
  min-height: 180rpx;
}

.grid {
  display: flex;
  gap: 20rpx;
}

.half {
  flex: 1;
}

.picker {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  color: #111827;
}

.proof-field {
  padding: 24rpx;
  border-radius: var(--app-radius-md, 28rpx);
  background: rgba(248, 250, 252, 0.72);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.proof-head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.proof-head .label {
  margin-bottom: 0;
}

.proof-tip {
  font-size: 22rpx;
  color: #64748b;
}

.completion-textarea {
  margin-top: 18rpx;
  min-height: 220rpx;
}

.progress-textarea {
  min-height: 190rpx;
}

.proof-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
  flex-wrap: wrap;
}

.proof-btn {
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(37, 99, 235, 0.1);
  backdrop-filter: blur(var(--app-blur-soft, 12px));
}

.proof-image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-top: 20rpx;
}

.proof-image-item,
.proof-video-card {
  position: relative;
}

.proof-image {
  width: 100%;
  height: 180rpx;
  border-radius: var(--app-radius-sm, 22rpx);
  background: rgba(226, 232, 240, 0.8);
}

.proof-remove {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 42rpx;
  height: 42rpx;
  line-height: 42rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 30rpx;
}

.proof-video-card {
  margin-top: 20rpx;
}

.proof-video {
  width: 100%;
  height: 320rpx;
  border-radius: var(--app-radius-sm, 24rpx);
  background: #000;
}

.video-remove {
  top: 16rpx;
  right: 16rpx;
}

.panel-footer {
  border-top: 1rpx solid rgba(120, 104, 84, 0.12);
}

.ghost-btn,
.primary-btn {
  flex: 1;
  text-align: center;
  border-radius: var(--app-radius-sm, 24rpx);
  padding: 24rpx 0;
  font-size: 28rpx;
  font-weight: 700;
}

.ghost-btn {
  background: rgba(243, 244, 246, 1);
  color: #374151;
}

.primary-btn {
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 16rpx 34rpx rgba(37, 99, 235, 0.24);
}

.close-btn:active,
.proof-btn:active,
.ghost-btn:active,
.primary-btn:active,
.proof-image-item:active {
  transform: scale(0.97);
}

.animate-pop {
  animation: popIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bounce-btn {
  animation: none;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translateY(40rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
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

@keyframes maskFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
