<template>
  <view class="page">
    <view class="page-shell">
      <view v-if="activeTab === 'home'" class="tab-panel home-panel">
        <view class="floating-board ultimate-board">
          <view class="board-label-row">
            <text class="board-label">终极目标</text>
            <text class="board-action" @tap="openUltimateGoal">{{ ultimateButtonText }}</text>
          </view>

          <template v-if="ultimateRootGoal">
            <view class="ultimate-title-row" @tap="openDetail(ultimateRootGoal)">
              <view>
                <view class="ultimate-title">{{ ultimateRootGoal.title }}</view>
                <view class="ultimate-date">到期日期：{{ formatDate(ultimateRootGoal.endTime) }}</view>
              </view>
              <view class="ultimate-status-badge" :style="ultimateStatusStyle">{{ ultimateStatusMeta.label }}</view>
            </view>

            <view class="ultimate-progress-wrap">
              <view class="ultimate-progress-label">当前进度</view>
              <view class="ultimate-progress-text">{{ ultimateRootGoal.currentProgress || '暂未记录，点击右上角可立即补充进度。' }}</view>
            </view>

            <view class="ultimate-meta-grid">
              <view class="meta-box">
                <text class="meta-box-label">剩余时间</text>
                <text class="meta-box-value emphasis">{{ formatRemainingTime(ultimateRootGoal.endTime) }}</text>
              </view>
              <view class="meta-box">
                <text class="meta-box-label">目标状态</text>
                <text class="meta-box-value">{{ ultimateStatusMeta.label }}</text>
              </view>
            </view>
          </template>

          <view v-else class="panel-empty">
            <view class="panel-empty-title">还没有终极目标</view>
            <view class="panel-empty-desc">首页顶部会持续浮动展示唯一终极目标的进度、到期日期与剩余时间。</view>
            <view class="panel-empty-btn" @tap="openUltimateGoal">立即设置</view>
          </view>
        </view>

        <view class="floating-board carousel-board">
          <view class="board-label-row">
            <view>
              <view class="carousel-title">当前进行中的目标</view>
            </view>
            <text class="carousel-count">{{ focusGoalTrees.length }} 项</text>
          </view>

          <swiper
            v-if="focusGoalTrees.length"
            class="goal-swiper"
            circular
            autoplay
            indicator-dots
            :interval="3200"
            :duration="450"
          >
            <swiper-item v-for="goal in focusGoalTrees" :key="goal.id">
              <scroll-view scroll-y="true" class="focus-card-scroll">
                <view class="focus-card">
                  <GoalFocusTree :goal="goal" @select="openDetail" />
                </view>
              </scroll-view>
            </swiper-item>
          </swiper>

          <GoalEmptyState
            v-else
            title="暂无进行中的目标"
            desc="点击目标列表页顶部的新增目标，开始添加主目标或继续拆分子目标。"
            button-text="新增目标"
            @create="openCreateRoot"
          />
        </view>
      </view>

      <view v-else-if="activeTab === 'list'" class="tab-panel list-panel">
        <view class="overview-board">
          <view class="overview-head">
            <view>
              <view class="overview-title">目标列表</view>
              <view class="overview-subtitle">查看、编辑并分组管理全部目标与子目标</view>
            </view>
            <view class="overview-action" @tap="openCreateRoot">
              <text class="overview-action-icon">＋</text>
              <text>新增目标</text>
            </view>
          </view>

          <view class="stats-grid">
            <view class="stat-card">
              <view class="stat-value">{{ totalCount }}</view>
              <view class="stat-label">总目标</view>
            </view>
            <view class="stat-card">
              <view class="stat-value">{{ doingCount }}</view>
              <view class="stat-label">进行中</view>
            </view>
            <view class="stat-card">
              <view class="stat-value">{{ completedCount }}</view>
              <view class="stat-label">已完成</view>
            </view>
            <view class="stat-card">
              <view class="stat-value">{{ abandonedCount }}</view>
              <view class="stat-label">已放弃</view>
            </view>
          </view>
        </view>

        <view v-if="ultimateRootGoal" class="mini-ultimate-card" @tap="openDetail(ultimateRootGoal)">
          <view>
            <view class="mini-ultimate-label">终极目标浮动卡片</view>
            <view class="mini-ultimate-title">{{ ultimateRootGoal.title }}</view>
          </view>
          <view class="mini-ultimate-meta">{{ formatRemainingTime(ultimateRootGoal.endTime) }}</view>
        </view>

        <view v-for="group in groupedGoals" :key="group.key" class="group-board">
          <view class="group-head" @tap="toggleGroup(group.key)">
            <view class="group-copy">
              <view class="group-title-row">
                <text class="group-title">{{ group.label }}</text>
                <text class="group-count">{{ group.count }} 项</text>
              </view>
              <text class="group-desc">{{ group.desc }}</text>
            </view>
            <view class="group-toggle" :class="{ expanded: groupExpanded[group.key] }">
              <text class="group-toggle-text">{{ groupExpanded[group.key] ? '收起' : '展开' }}</text>
              <text class="group-toggle-arrow">⌃</text>
            </view>
          </view>

          <transition name="board-collapse">
            <view v-if="groupExpanded[group.key]" class="group-body">
              <view v-if="!group.goals.length" class="group-empty">
                <view class="group-empty-title">当前没有{{ group.label }}</view>
                <view class="group-empty-desc">该分组为空时，你依然可以继续新增目标或从其他分组调整状态。</view>
              </view>

              <GoalNode
                v-for="goal in group.goals"
                :key="goal.id"
                :goal="goal"
                :level="0"
                @select="openDetail"
                @edit="openEdit"
                @delete="confirmDelete"
                @add-child="openCreateChild"
                @status-change="changeStatus"
              />
            </view>
          </transition>
        </view>
      </view>

      <view
        v-else
        ref="chartPanelRef"
        class="tab-panel chart-panel"
        @wheel.capture.stop.prevent="handleChartWheel"
        @mousewheel.capture.stop.prevent="handleChartWheel"
        @touchstart="handleChartTouchStart"
        @touchmove="handleChartTouchMove"
        @touchend="handleChartTouchEnd"
        @touchcancel="handleChartTouchEnd"
      >
        <view class="chart-board">
          <view class="chart-hero">
            <view class="chart-hero-side">
              <view class="chart-zoom-actions">
                <view class="chart-zoom-chip">缩放 {{ Math.round(chartZoom * 100) }}%</view>
                <view class="chart-zoom-reset" @tap="resetChartZoom">缩放还原</view>
              </view>
              <view class="chart-zoom-tip">双指或滚轮可缩放，缩放后会自动定位到今天并以今天为基准展示</view>
            </view>

            <view class="chart-hero-center">
              <view class="chart-hero-label">终极目标 / 全局进度</view>
              <view class="chart-hero-title">{{ chartSummary.ultimateTitle }}</view>
              <view class="chart-hero-progress">{{ chartSummary.ultimateProgress }}</view>

              <view class="chart-progress-track">
                <view class="chart-progress-fill" :style="{ width: chartSummary.progressWidth }"></view>
              </view>

              <view class="chart-progress-meta">
                <text>{{ chartSummary.progressText }}</text>
                <text>{{ chartSummary.completed }} / {{ chartSummary.total || 0 }} 已完成</text>
              </view>
            </view>

            <view class="chart-hero-side chart-hero-side-right">
              <view class="chart-density-chip">{{ chartDensityLabel }}</view>
              <view class="chart-range-tip">{{ chartTimeline.rangeLabel }}</view>
            </view>
          </view>

          <view v-if="!chartTimeline.hasGoals" class="chart-empty-state">
            <view class="chart-icon">◌</view>
            <view class="chart-title">目标时间图</view>
            <view class="chart-desc">当前还没有可展示的普通目标，新增后会按开始、进行中、完成、放弃时间自动排布到时间轴。</view>
          </view>

          <scroll-view
            v-else
            ref="timelineScrollRef"
            scroll-x="true"
            :scroll-left="timelineScrollLeft"
            class="timeline-scroll"
            show-scrollbar="false"
            @wheel.capture.stop.prevent="handleChartWheel"
            @mousewheel.capture.stop.prevent="handleChartWheel"
          >
            <view class="timeline-content" :style="{ width: chartTimeline.contentWidth }">
              <view class="timeline-axis">
                <view v-for="tick in chartTimeline.ticks" :key="tick.key" class="timeline-tick" :style="{ left: tick.left }">
                  <view class="timeline-tick-line"></view>
                  <text class="timeline-tick-label">{{ tick.label }}</text>
                </view>

                <view v-if="chartTimeline.todayVisible" class="timeline-today" :style="{ left: chartTimeline.todayLeft }">
                  <view class="timeline-today-line"></view>
                  <text class="timeline-today-label">今天</text>
                </view>

              </view>

              <view class="timeline-stage">
                <view class="timeline-stage-head">
                  <view class="timeline-stage-count">{{ chartTimeline.count }} 项</view>
                </view>

                <view class="timeline-stage-body" :style="{ height: chartTimeline.height }">
                  <view
                    v-for="tick in chartTimeline.ticks"
                    :key="tick.key"
                    class="timeline-grid-line"
                    :style="{ left: tick.left }"
                  ></view>

                  <view
                    v-if="chartTimeline.todayVisible"
                    class="timeline-grid-line today"
                    :style="{ left: chartTimeline.todayLeft }"
                  ></view>

                  <view v-if="!chartTimeline.items.length" class="timeline-stage-empty">
                    当前没有可展示的目标。
                  </view>

                  <view
                    v-for="item in chartTimeline.items"
                    :key="item.id"
                    class="timeline-goal-card"
                    :class="[chartDisplayMode, item.status, { active: activeProofGoalId === item.id, tappable: item.status === 'completed' && item.hasProof }]"
                    :style="item.style"
                    @tap="handleTimelineGoalTap(item)"
                  >
                    <view class="timeline-goal-accent" :style="{ background: item.color }"></view>
                    <view class="timeline-goal-head">
                      <text class="timeline-goal-title">{{ item.title }}</text>
                      <text class="timeline-goal-badge" :style="item.badgeStyle">{{ item.eventLabel }}</text>
                    </view>

                    <view class="timeline-goal-time">{{ item.timeText }}</view>

                    <view v-if="chartDisplayMode !== 'compact' && item.deadlineText" class="timeline-goal-deadline">
                      截止：{{ item.deadlineText }}
                    </view>

                    <view v-if="chartDisplayMode === 'detail' && item.extraText" class="timeline-goal-extra">
                      {{ item.extraText }}
                    </view>

                    <view v-if="item.status === 'completed' && item.hasProof" class="timeline-goal-proof-tip">
                      {{ activeProofGoalId === item.id ? '点击收起完成凭证' : '点击展开完成凭证' }}
                    </view>

                    <view v-if="item.status === 'completed' && activeProofGoalId === item.id" class="completion-popover" @tap.stop>
                      <view class="completion-popover-title">完成凭证</view>

                      <view v-if="item.completionNote" class="completion-popover-note">
                        {{ item.completionNote }}
                      </view>

                      <scroll-view
                        v-if="item.completionImages.length"
                        scroll-x="true"
                        class="completion-image-scroll"
                        show-scrollbar="false"
                      >
                        <view class="completion-image-row">
                          <image
                            v-for="(image, imageIndex) in item.completionImages"
                            :key="image + imageIndex"
                            class="completion-popover-image"
                            :src="image"
                            mode="aspectFill"
                          />
                        </view>
                      </scroll-view>

                      <video
                        v-if="item.completionVideo"
                        class="completion-popover-video"
                        :src="item.completionVideo"
                        controls
                        object-fit="cover"
                      ></video>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <view class="bottom-nav">
      <view class="nav-item" :class="{ active: activeTab === 'home' }" @tap="switchTab('home')">
        <text class="nav-icon">⌂</text>
        <text class="nav-label">首页</text>
      </view>
      <view class="nav-item" :class="{ active: activeTab === 'list' }" @tap="switchTab('list')">
        <text class="nav-icon">≣</text>
        <text class="nav-label">目标列表</text>
      </view>
      <view class="nav-item" :class="{ active: activeTab === 'chart' }" @tap="switchTab('chart')">
        <text class="nav-icon">⌇</text>
        <text class="nav-label">目标时间图</text>
      </view>
    </view>

    <view v-if="detailVisible" class="detail-mask" @tap="closeDetail">
      <view class="detail-sheet" @tap.stop>
        <view class="detail-sheet-head">
          <view>
            <view class="detail-sheet-title">目标详情</view>
            <view class="detail-sheet-subtitle">点击卡片内操作可直接编辑、删除或拆分子目标</view>
          </view>
          <view class="detail-sheet-close" @tap="closeDetail">×</view>
        </view>

        <scroll-view scroll-y="true" class="detail-sheet-body">
          <GoalNode
            v-if="selectedGoal"
            :goal="selectedGoal"
            :level="0"
            @select="openDetail"
            @edit="openEdit"
            @delete="confirmDelete"
            @add-child="openCreateChild"
            @status-change="changeStatus"
          />
        </scroll-view>
      </view>
    </view>

    <GoalFormDialog
      :visible="dialog.visible"
      :mode="dialog.mode"
      :initial-value="dialog.initialValue"
      :parent-goal-title="dialog.parentGoalTitle"
      @close="closeDialog"
      @save="saveGoal"
    />
  </view>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import GoalEmptyState from '../../components/GoalEmptyState.vue';
import GoalFocusTree from '../../components/GoalFocusTree.vue';
import GoalFormDialog from '../../components/GoalFormDialog.vue';
import GoalNode from '../../components/GoalNode.vue';
import { useGoalStore } from '../../store/goalStore';
import { formatDate, formatRemainingTime, getStatusMeta, sortGoalsByRemainingTime } from '../../utils/goalUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CHART_ZOOM = 1;
const MIN_CHART_ZOOM = 0.25;
const MAX_CHART_ZOOM = 2.4;
const WINDOW_WIDTH = uni.getSystemInfoSync ? uni.getSystemInfoSync().windowWidth || 375 : 375;
const WHEEL_LISTENER_OPTIONS = { passive: false, capture: true };
const HAS_DOM_QUERY = typeof document !== 'undefined' && typeof document.querySelector === 'function';
const HAS_DOM_EVENT_API = typeof document !== 'undefined' && typeof document.addEventListener === 'function';

const {
  state,
  allGoals,
  ultimateGoal,
  totalCount,
  doingCount,
  completedCount,
  abandonedCount,
  addGoal,
  editGoal,
  removeGoal,
  addSubGoal,
  setGoalStatus,
} = useGoalStore();

const activeTab = ref('home');
const detailVisible = ref(false);
const selectedGoalId = ref('');
const chartPanelRef = ref(null);
const timelineScrollRef = ref(null);
const timelineScrollLeft = ref(0);
const chartZoom = ref(DEFAULT_CHART_ZOOM);
const activeProofGoalId = ref('');
const pinchState = reactive({
  active: false,
  startDistance: 0,
  startZoom: 1,
});
const dialog = reactive({
  visible: false,
  mode: 'create',
  initialValue: {},
  parentGoalId: '',
  parentGoalTitle: '',
});

const groupExpanded = reactive({
  doing: true,
  completed: false,
  abandoned: false,
});

const regularGoals = computed(() => state.goals.filter((goal) => !goal.isUltimate));
const regularFlatGoals = computed(() => allGoals.value.filter((goal) => !goal.isUltimate));
const ultimateRootGoal = computed(() => state.goals.find((goal) => goal.isUltimate) || ultimateGoal.value || null);
const ultimateButtonText = computed(() => (ultimateRootGoal.value ? '编辑终极目标' : '设置终极目标'));
const ultimateStatusMeta = computed(() => getStatusMeta(ultimateRootGoal.value?.status || 'doing'));
const ultimateStatusStyle = computed(() => ({
  color: ultimateStatusMeta.value.color,
  background: `${ultimateStatusMeta.value.color}1A`,
}));
const focusGoalTrees = computed(() => sortGoalTree(filterGoalTree(regularGoals.value, 'doing')));
const chartDisplayMode = computed(() => {
  if (chartZoom.value >= 1.45) {
    return 'detail';
  }

  if (chartZoom.value < 0.5) {
    return 'compact';
  }

  return 'normal';
});
const chartDensityLabel = computed(() => {
  if (chartDisplayMode.value === 'detail') {
    return '细节视图';
  }

  if (chartDisplayMode.value === 'compact') {
    return '月视图';
  }

  return chartZoom.value >= 1 ? '日视图' : '月视图';
});
const chartSummary = computed(() => {
  const total = regularFlatGoals.value.length;
  const completed = regularFlatGoals.value.filter((goal) => goal.status === 'completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    percent,
    progressWidth: `${Math.max(total ? percent : 6, 6)}%`,
    progressText: total ? `整体完成度 ${percent}%` : '整体完成度 0%',
    ultimateTitle: ultimateRootGoal.value?.title || '暂未设置终极目标',
    ultimateProgress: ultimateRootGoal.value?.currentProgress || '尚未记录终极目标当前进度。',
  };
});
const chartTimeline = computed(() => buildChartTimeline(regularFlatGoals.value, chartZoom.value, chartDisplayMode.value));
const groupedGoals = computed(() => {
  return [
    {
      key: 'doing',
      label: '进行中',
      desc: '优先关注即将到期的目标，可继续编辑、拆分和变更状态。',
      count: allGoals.value.filter((goal) => goal.status === 'doing' && !goal.isUltimate).length,
      goals: sortGoalTree(filterGoalTree(regularGoals.value, 'doing')),
    },
    {
      key: 'completed',
      label: '已完成',
      desc: '查看已经完成的目标记录、凭证内容与对应子目标。',
      count: allGoals.value.filter((goal) => goal.status === 'completed' && !goal.isUltimate).length,
      goals: sortGoalTree(filterGoalTree(regularGoals.value, 'completed')),
    },
    {
      key: 'abandoned',
      label: '已放弃',
      desc: '集中查看已放弃目标，便于后续恢复、删除或复盘。',
      count: allGoals.value.filter((goal) => goal.status === 'abandoned' && !goal.isUltimate).length,
      goals: sortGoalTree(filterGoalTree(regularGoals.value, 'abandoned')),
    },
  ];
});
const selectedGoal = computed(() => {
  if (!selectedGoalId.value) {
    return null;
  }

  const found = findGoalTreeById(state.goals, selectedGoalId.value);
  if (!found) {
    return null;
  }

  return sortGoalTree([found])[0] || null;
});

function filterGoalTree(goals, filter) {
  const walk = (items) => {
    return (items || []).reduce((result, goal) => {
      const children = goal.children && goal.children.length ? walk(goal.children) : [];
      if (goal.status === filter || children.length) {
        result.push({
          ...goal,
          children,
        });
      }
      return result;
    }, []);
  };

  return walk(goals);
}

function sortGoalTree(goals) {
  return sortGoalsByRemainingTime(goals).map((goal) => ({
    ...goal,
    children: goal.children && goal.children.length ? sortGoalTree(goal.children) : [],
  }));
}

function findGoalTreeById(goals, goalId) {
  for (const goal of goals || []) {
    if (goal.id === goalId) {
      return goal;
    }

    if (goal.children && goal.children.length) {
      const found = findGoalTreeById(goal.children, goalId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateChartZoom(nextZoom, options = {}) {
  const normalizedZoom = Number(clamp(nextZoom, MIN_CHART_ZOOM, MAX_CHART_ZOOM).toFixed(2));
  const shouldSyncToToday = options.forceSync || normalizedZoom !== chartZoom.value;

  chartZoom.value = normalizedZoom;

  if (shouldSyncToToday) {
    nextTick(() => {
      syncTimelineToToday();
    });
  }
}

function resetChartZoom() {
  updateChartZoom(DEFAULT_CHART_ZOOM, { forceSync: true });
}

function applyTimelineScrollLeft(nextLeft) {
  const normalizedLeft = Math.max(0, Math.round(Number(nextLeft) || 0));
  timelineScrollLeft.value = normalizedLeft;

  const scrollElement = resolveNativeElement(timelineScrollRef.value) || (HAS_DOM_QUERY ? document.querySelector('.timeline-scroll') : null);
  if (scrollElement && typeof scrollElement.scrollLeft === 'number') {
    scrollElement.scrollLeft = normalizedLeft;
  }
}

function parseYmdToMs(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const parts = String(value).split('-').map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
    return null;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0).getTime();
}

function parseIsoToMs(value) {
  if (!value) {
    return null;
  }

  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function formatAxisLabel(ms, mode = 'normal', totalDays = 0) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (mode === 'year') {
    return `${year}年`;
  }

  if (mode === 'compact') {
    return `${year}年${month}月`;
  }

  if (mode === 'detail') {
    if (month === 1 && day === 1) {
      return `${year}年1月1日`;
    }

    return `${month}月${day}日`;
  }

  return `${month}.${day}`;
}

function pushAxisTick(ticks, tickMs, rangeStart, totalSpan, labelMode, suffix = '') {
  ticks.push({
    key: `${tickMs}_${labelMode}${suffix}`,
    label: formatAxisLabel(tickMs, labelMode),
    left: `${((tickMs - rangeStart) / totalSpan) * 100}%`,
  });
}

function formatMsToDate(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDistance(touches = []) {
  if (!touches || touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const deltaX = Number(second.pageX || 0) - Number(first.pageX || 0);
  const deltaY = Number(second.pageY || 0) - Number(first.pageY || 0);
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function getCardHeight(mode) {
  return 132;
}

function getColumnWidth(zoom, mode) {
  const base = mode === 'detail' ? 108 : mode === 'compact' ? 32 : 84;
  return Math.round(base * zoom);
}

function getStatusPriority(status) {
  if (status === 'doing') {
    return 0;
  }

  if (status === 'completed') {
    return 1;
  }

  return 2;
}

function buildTicks(startMs, endMs, mode, zoom = 1) {
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
  const totalSpan = Math.max(DAY_MS, endMs - startMs);
  const zoomValue = Number(zoom || 1);
  const labelMode = zoomValue >= 1 ? 'detail' : 'compact';

  const ticks = [];

  if (labelMode === 'detail') {
    for (let index = 0; index <= totalDays; index += 1) {
      const currentMs = startMs + index * DAY_MS;
      pushAxisTick(ticks, currentMs, startMs, totalSpan, labelMode, `_${index}`);
    }
  } else if (labelMode === 'compact') {
    const cursor = new Date(startMs);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= endMs) {
      pushAxisTick(ticks, cursor.getTime(), startMs, totalSpan, labelMode);
      cursor.setMonth(cursor.getMonth() + 1, 1);
    }
  }

  const finalLeft = '100%';
  const finalLabel = formatAxisLabel(endMs, labelMode, totalDays);
  if (!ticks.length || ticks[ticks.length - 1].label !== finalLabel) {
    ticks.push({ key: `final_${endMs}`, label: finalLabel, left: finalLeft });
  }

  return ticks;
}

function buildTimelineItem(goal, nowMs) {
  const startMs = parseYmdToMs(goal.startTime) || parseIsoToMs(goal.createdAt) || nowMs;
  const deadlineMs = parseYmdToMs(goal.endTime, true);
  const completedAtMs = parseIsoToMs(goal.completedAt);
  const abandonedAtMs = parseIsoToMs(goal.abandonedAt);
  const updatedMs = parseIsoToMs(goal.updatedAt);
  const statusMeta = getStatusMeta(goal.status);
  const eventMs = goal.status === 'doing'
    ? Math.max(startMs, nowMs)
    : goal.status === 'completed'
      ? completedAtMs || updatedMs || deadlineMs || startMs
      : abandonedAtMs || updatedMs || deadlineMs || startMs;
  const plannedEndMs = deadlineMs || eventMs;
  const visibleEndMs = Math.max(startMs + DAY_MS * 0.8, plannedEndMs || startMs + DAY_MS * 0.8);
  const eventDateText = formatDate(formatMsToDate(eventMs));
  const eventActionText = goal.status === 'completed' ? '完成' : '放弃';
  const expectedDateText = goal.endTime ? formatDate(goal.endTime) : '';

  return {
    ...goal,
    color: statusMeta.color,
    startMs,
    eventMs,
    deadlineMs,
    endMs: visibleEndMs,
    eventLabel: goal.status === 'doing' ? '进行中' : goal.status === 'completed' ? '已完成' : '已放弃',
    timeText: goal.status === 'doing'
      ? expectedDateText
        ? `${formatDate(goal.startTime || '')} 开始 · 预计 ${expectedDateText} 完成`
        : `${formatDate(goal.startTime || '')} 开始 · 当前正在推进`
      : `${formatDate(goal.startTime || '')} 开始 · ${eventDateText} ${eventActionText}`,
    deadlineText: expectedDateText,
    deadlinePrefix: goal.status === 'doing' ? '预计完成' : '截止',
    extraText: goal.purpose || goal.content || '',
    hasProof: Boolean(goal.completionNote || (goal.completionImages && goal.completionImages.length) || goal.completionVideo),
    badgeStyle: {
      color: statusMeta.color,
      background: `${statusMeta.color}1A`,
    },
  };
}

function layoutTimelineItems(items, rangeStart, rangeEnd, mode) {
  const cardHeight = getCardHeight(mode);
  const rowGap = 16;
  const verticalPadding = 16;
  const rowEndTimes = [];
  const totalSpan = Math.max(DAY_MS, rangeEnd - rangeStart);
  const minWidthPercent = mode === 'compact' ? 8 : 12;

  const arranged = items
    .slice()
    .sort((first, second) => {
      if (first.startMs !== second.startMs) {
        return first.startMs - second.startMs;
      }

      const priorityDiff = getStatusPriority(first.status) - getStatusPriority(second.status);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return first.endMs - second.endMs;
    })
    .map((item) => {
      let rowIndex = getStatusPriority(item.status);
      const visualSpanMs = Math.max(item.endMs - item.startMs, totalSpan * (minWidthPercent / 100));
      const visualEndMs = item.startMs + visualSpanMs;
      while (rowEndTimes[rowIndex] !== undefined && item.startMs <= rowEndTimes[rowIndex]) {
        rowIndex += 3;
      }

      rowEndTimes[rowIndex] = Math.max(visualEndMs, item.endMs, item.deadlineMs || item.endMs);
      return {
        item,
        rowIndex,
        visualEndMs,
      };
    });

  const compactRowMap = Array.from(new Set(arranged.map(({ rowIndex }) => rowIndex)))
    .sort((first, second) => first - second)
    .reduce((result, rowIndex, denseIndex) => {
      result[rowIndex] = denseIndex;
      return result;
    }, {});

  const renderedItems = arranged.map(({ item, rowIndex }) => {
    const denseRowIndex = compactRowMap[rowIndex] !== undefined ? compactRowMap[rowIndex] : 0;
    const leftPercent = ((item.startMs - rangeStart) / totalSpan) * 100;
    const widthPercent = Math.max((((item.endMs - item.startMs) / totalSpan) * 100), minWidthPercent);
    const top = verticalPadding + denseRowIndex * (cardHeight + rowGap);

    return {
      ...item,
      style: {
        left: `${clamp(leftPercent, 0, 96)}%`,
        width: `${clamp(widthPercent, minWidthPercent, 92)}%`,
        top: `${top}rpx`,
        height: `${cardHeight}rpx`,
        borderColor: `${item.color}55`,
        background: `linear-gradient(135deg, ${item.color}14, rgba(255,255,255,0.98))`,
        boxShadow: activeProofGoalId.value === item.id ? `0 24rpx 56rpx ${item.color}2A` : '0 16rpx 36rpx rgba(15, 23, 42, 0.08)',
      },
    };
  });

  const rowCount = Object.keys(compactRowMap).length || 1;
  const laneHeight = verticalPadding * 2 + rowCount * cardHeight + (rowCount - 1) * rowGap;

  return {
    items: renderedItems,
    height: `${laneHeight}rpx`,
    count: items.length,
  };
}

function buildChartTimeline(goals, zoom, mode) {
  const nowMs = Date.now();
  const items = goals.map((goal) => buildTimelineItem(goal, nowMs));
  const startCandidates = items.map((item) => item.startMs).filter(Boolean);
  const closedCandidates = items
    .filter((item) => item.status !== 'doing')
    .map((item) => item.eventMs)
    .filter(Boolean);
  const fallbackEndCandidates = items.map((item) => item.deadlineMs || item.endMs || item.eventMs || item.startMs).filter(Boolean);
  const baseStart = startCandidates.length ? Math.min(...startCandidates) : nowMs - DAY_MS * 30;
  const endCandidates = [...closedCandidates, ...fallbackEndCandidates].filter(Boolean);
  const baseEnd = endCandidates.length ? Math.max(...endCandidates) : nowMs + DAY_MS * 30;
  const currentYear = new Date(nowMs).getFullYear();
  const startYear = Math.min(new Date(baseStart).getFullYear(), currentYear - 1);
  const endYear = Math.max(new Date(baseEnd).getFullYear(), currentYear + 1);
  const startBoundary = new Date(startYear, 0, 1, 0, 0, 0, 0);
  const endBoundary = new Date(endYear, 11, 31, 23, 59, 59, 999);
  const rangeStart = startBoundary.getTime();
  const rangeEnd = endBoundary.getTime();
  const totalDays = Math.max(10, Math.ceil((rangeEnd - rangeStart) / DAY_MS) + 1);
  const minWidth = mode === 'compact' ? 720 : mode === 'detail' ? 1800 : 1280;
  const contentWidthValue = Math.max(minWidth, totalDays * getColumnWidth(zoom, mode));
  const stageResult = layoutTimelineItems(items, rangeStart, rangeEnd, mode);
  const todayVisible = nowMs >= rangeStart && nowMs <= rangeEnd;
  const todayLeft = `${((nowMs - rangeStart) / Math.max(DAY_MS, rangeEnd - rangeStart)) * 100}%`;

  return {
    hasGoals: items.length > 0,
    contentWidth: `${contentWidthValue}rpx`,
    contentWidthValue,
    rangeStart,
    rangeEnd,
    ticks: buildTicks(rangeStart, rangeEnd, mode, zoom),
    todayVisible,
    todayLeft,
    rangeLabel: `${formatDate(formatMsToDate(rangeStart))} - ${formatDate(formatMsToDate(rangeEnd))}`,
    items: stageResult.items,
    height: stageResult.height,
    count: stageResult.count,
  };
}

function syncTimelineToToday() {
  if (activeTab.value !== 'chart') {
    return;
  }

  if (!chartTimeline.value.hasGoals || !chartTimeline.value.todayVisible) {
    applyTimelineScrollLeft(0);
    return;
  }

  const scrollElement = resolveNativeElement(timelineScrollRef.value) || (HAS_DOM_QUERY ? document.querySelector('.timeline-scroll') : null);
  const viewportWidthPx = scrollElement?.clientWidth || WINDOW_WIDTH;
  const contentWidthPx = (chartTimeline.value.contentWidthValue * WINDOW_WIDTH) / 750;
  const todayOffsetPx = contentWidthPx * ((Date.now() - chartTimeline.value.rangeStart) / Math.max(DAY_MS, chartTimeline.value.rangeEnd - chartTimeline.value.rangeStart));
  const nextLeft = Math.max(0, Math.min(todayOffsetPx - viewportWidthPx / 2, Math.max(0, contentWidthPx - viewportWidthPx)));

  applyTimelineScrollLeft(nextLeft);

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      applyTimelineScrollLeft(nextLeft);
    });
  }
}

function switchTab(tab) {
  activeTab.value = tab;
  activeProofGoalId.value = '';
}

function toggleGroup(key) {
  groupExpanded[key] = !groupExpanded[key];
}

function openDetail(goal) {
  selectedGoalId.value = goal.id;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
}

function handleTimelineGoalTap(goal) {
  if (goal.status === 'completed' && goal.hasProof) {
    activeProofGoalId.value = activeProofGoalId.value === goal.id ? '' : goal.id;
    return;
  }

  activeProofGoalId.value = '';
  openDetail(goal);
}

function handleChartTouchStart(event) {
  const touches = event.touches || [];
  if (touches.length < 2) {
    return;
  }

  pinchState.active = true;
  pinchState.startDistance = getDistance(touches);
  pinchState.startZoom = chartZoom.value;
}

function handleChartTouchMove(event) {
  const touches = event.touches || [];
  if (!pinchState.active || touches.length < 2) {
    return;
  }

  const currentDistance = getDistance(touches);
  if (!currentDistance || !pinchState.startDistance) {
    return;
  }

  updateChartZoom(pinchState.startZoom * (currentDistance / pinchState.startDistance));
}

function handleChartTouchEnd(event) {
  const touches = event.touches || [];
  if (touches.length >= 2) {
    return;
  }

  pinchState.active = false;
  pinchState.startDistance = 0;
  pinchState.startZoom = chartZoom.value;
}

function handleChartWheel(event) {
  if (activeTab.value !== 'chart') {
    return;
  }

  const rawDelta = Number(event?.deltaY || event?.wheelDeltaY || event?.wheelDelta || 0);
  if (!rawDelta) {
    return;
  }

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  if (typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const step = Math.min(0.32, Math.max(0.08, Math.abs(rawDelta) / 600));
  const direction = rawDelta < 0 ? 1 : -1;
  updateChartZoom(chartZoom.value + direction * step);
}

function handleGlobalWheel(event) {
  if (activeTab.value !== 'chart' || !isWheelInsideChart(event)) {
    return;
  }

  handleChartWheel(event);
}

function resolveNativeElement(target) {
  if (!target) {
    return null;
  }

  if (typeof target.addEventListener === 'function') {
    return target;
  }

  if (target.$el && typeof target.$el.addEventListener === 'function') {
    return target.$el;
  }

  if (target.$?.vnode?.el && typeof target.$.vnode.el.addEventListener === 'function') {
    return target.$.vnode.el;
  }

  return null;
}

function queryChartDomElements() {
  if (!HAS_DOM_QUERY) {
    return [];
  }

  return [document.querySelector('.chart-panel'), document.querySelector('.timeline-scroll')].filter(Boolean);
}

function getChartWheelTargets() {
  const targets = [...queryChartDomElements(), resolveNativeElement(chartPanelRef.value), resolveNativeElement(timelineScrollRef.value)].filter(Boolean);
  return targets.filter((element, index) => targets.indexOf(element) === index);
}

function isWheelInsideChart(event) {
  const targets = getChartWheelTargets();
  if (!targets.length) {
    return activeTab.value === 'chart';
  }

  const eventPath = typeof event?.composedPath === 'function' ? event.composedPath() : [];
  const eventTarget = event?.target || null;

  if (eventPath.length) {
    return targets.some((element) => eventPath.includes(element));
  }

  if (eventTarget) {
    return targets.some((element) => typeof element.contains === 'function' && element.contains(eventTarget));
  }

  const pointX = Number(event?.clientX);
  const pointY = Number(event?.clientY);
  if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
    return false;
  }

  return targets.some((element) => {
    if (!element || typeof element.getBoundingClientRect !== 'function') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return pointX >= rect.left && pointX <= rect.right && pointY >= rect.top && pointY <= rect.bottom;
  });
}

function bindWheelZoom() {
  const elements = getChartWheelTargets();

  elements.forEach((element) => {
    element.addEventListener('wheel', handleChartWheel, WHEEL_LISTENER_OPTIONS);
    element.addEventListener('mousewheel', handleChartWheel, WHEEL_LISTENER_OPTIONS);
  });
}

function unbindWheelZoom() {
  const elements = getChartWheelTargets();

  elements.forEach((element) => {
    element.removeEventListener('wheel', handleChartWheel, WHEEL_LISTENER_OPTIONS);
    element.removeEventListener('mousewheel', handleChartWheel, WHEEL_LISTENER_OPTIONS);
  });
}

watch(
  () => activeTab.value,
  async (tab) => {
    unbindWheelZoom();
    if (tab !== 'chart') {
      return;
    }

    await nextTick();
    bindWheelZoom();
    syncTimelineToToday();
  },
  { immediate: true }
);

watch(
  () => chartTimeline.value.contentWidthValue,
  async () => {
    if (activeTab.value !== 'chart') {
      return;
    }

    await nextTick();
    unbindWheelZoom();
    bindWheelZoom();
    syncTimelineToToday();
  }
);

onMounted(() => {
  if (HAS_DOM_EVENT_API) {
    document.addEventListener('wheel', handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
    document.addEventListener('mousewheel', handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
  }

  if (activeTab.value === 'chart') {
    bindWheelZoom();
  }
});

onBeforeUnmount(() => {
  unbindWheelZoom();

  if (HAS_DOM_EVENT_API) {
    document.removeEventListener('wheel', handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
    document.removeEventListener('mousewheel', handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
  }
});

function openCreateRoot() {
  dialog.visible = true;
  dialog.mode = 'create';
  dialog.initialValue = {
    isUltimate: false,
  };
  dialog.parentGoalId = '';
  dialog.parentGoalTitle = '';
}

function openEdit(goal) {
  closeDetail();
  dialog.visible = true;
  dialog.mode = goal.isUltimate ? 'ultimate' : 'edit';
  dialog.initialValue = { ...goal };
  dialog.parentGoalId = '';
  dialog.parentGoalTitle = '';
}

function openUltimateGoal() {
  closeDetail();
  dialog.visible = true;
  dialog.mode = 'ultimate';
  dialog.initialValue = ultimateRootGoal.value
    ? { ...ultimateRootGoal.value }
    : {
        isUltimate: true,
        status: 'doing',
      };
  dialog.parentGoalId = '';
  dialog.parentGoalTitle = '';
}

function openCreateChild(goal) {
  closeDetail();
  dialog.visible = true;
  dialog.mode = 'child';
  dialog.initialValue = {
    isUltimate: false,
  };
  dialog.parentGoalId = goal.id;
  dialog.parentGoalTitle = goal.title;
}

function openCompleteGoal(goal) {
  closeDetail();
  dialog.visible = true;
  dialog.mode = 'complete';
  dialog.initialValue = {
    ...goal,
    status: 'completed',
  };
  dialog.parentGoalId = '';
  dialog.parentGoalTitle = '';
}

function closeDialog() {
  dialog.visible = false;
}

function saveGoal(form) {
  let success = false;

  if ((dialog.mode === 'edit' || dialog.mode === 'complete' || dialog.mode === 'ultimate') && dialog.initialValue && dialog.initialValue.id) {
    success = editGoal(dialog.initialValue.id, form);
  } else if (dialog.mode === 'child' && dialog.parentGoalId) {
    success = addSubGoal(dialog.parentGoalId, form);
  } else {
    success = addGoal(form);
  }

  if (!success) {
    uni.showToast({ title: '终极目标只允许设置一个，请直接编辑已有终极目标', icon: 'none' });
    return;
  }

  closeDialog();
}

function confirmDelete(goal) {
  uni.showModal({
    title: '删除目标',
    content: '确认删除「' + goal.title + '」吗？删除后其子目标也会一起移除。',
    confirmColor: '#dc2626',
    success: (res) => {
      if (res.confirm) {
        removeGoal(goal.id);
        if (selectedGoalId.value === goal.id) {
          closeDetail();
        }
      }
    },
  });
}

function changeStatus(payload) {
  if (!payload || !payload.goal) {
    return;
  }

  if (payload.status === 'completed') {
    openCompleteGoal(payload.goal);
    return;
  }

  setGoalStatus(payload.goal.id, payload.status);
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: 188rpx;
  position: relative;
}

.page::before,
.page::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(24rpx);
}

.page::before {
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.16), rgba(37, 99, 235, 0));
  top: 120rpx;
  right: -80rpx;
}

.page::after {
  width: 360rpx;
  height: 360rpx;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.12), rgba(124, 58, 237, 0));
  left: -90rpx;
  bottom: 160rpx;
}

.page-shell,
.bottom-nav,
.detail-mask {
  position: relative;
  z-index: 1;
}

.tab-panel {
  min-height: calc(100vh - 240rpx);
}

.floating-board,
.overview-board,
.group-board,
.mini-ultimate-card,
.chart-placeholder {
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(120, 104, 84, 0.12);
  box-shadow: 0 18rpx 48rpx rgba(44, 35, 20, 0.08);
  backdrop-filter: blur(12px);
}

.floating-board,
.overview-board,
.chart-placeholder {
  border-radius: 36rpx;
  padding: 28rpx;
}

.board-label-row,
.overview-head,
.group-head,
.detail-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.board-label {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(124, 58, 237, 0.1);
  color: #6d28d9;
  font-size: 22rpx;
  font-weight: 700;
}

.board-action,
.overview-action,
.panel-empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.board-action {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.1);
}

.overview-action {
  gap: 10rpx;
  padding: 18rpx 30rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 16rpx 36rpx rgba(37, 99, 235, 0.28);
}

.overview-action-icon {
  font-size: 28rpx;
  line-height: 1;
  font-weight: 800;
}

.ultimate-board {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.94), rgba(255, 255, 255, 0.9));
}

.ultimate-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 24rpx;
}

.ultimate-title {
  font-size: 38rpx;
  line-height: 1.35;
  font-weight: 800;
  color: #111827;
}

.ultimate-date {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.ultimate-status-badge,
.focus-card-status,
.mini-ultimate-meta,
.carousel-count,
.group-count {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.ultimate-progress-wrap {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.72);
}

.ultimate-progress-label,
.meta-box-label,
.focus-metric-label,
.mini-ultimate-label {
  font-size: 22rpx;
  color: #6b7280;
}

.ultimate-progress-text {
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #4c1d95;
}

.ultimate-meta-grid,
.focus-card-grid,
.stats-grid {
  display: grid;
  gap: 18rpx;
}

.ultimate-meta-grid,
.focus-card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 20rpx;
}

.meta-box,
.focus-metric,
.stat-card {
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.82);
}

.meta-box-value,
.focus-metric-value,
.mini-ultimate-title,
.carousel-title,
.overview-title,
.group-title,
.chart-title,
.panel-empty-title,
.group-empty-title,
.detail-sheet-title {
  display: block;
  color: #111827;
  font-weight: 800;
}

.meta-box-value,
.focus-metric-value,
.mini-ultimate-title {
  margin-top: 10rpx;
  font-size: 28rpx;
}

.emphasis {
  color: #7c3aed;
}

.panel-empty {
  margin-top: 24rpx;
}

.panel-empty-desc,
.carousel-subtitle,
.overview-subtitle,
.group-desc,
.chart-desc,
.group-empty-desc,
.detail-sheet-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6b7280;
}

.panel-empty-btn {
  margin-top: 20rpx;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.carousel-board,
.overview-board,
.group-board,
.mini-ultimate-card {
  margin-top: 24rpx;
}

.goal-swiper {
  height: 720rpx;
  margin-top: 24rpx;
}

.focus-card-scroll {
  height: 100%;
}

.focus-card {
  min-height: 100%;
  padding: 8rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.92));
  border: 1rpx solid rgba(148, 163, 184, 0.18);
}

.mini-ultimate-card,
.group-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.overview-title,
.carousel-title,
.group-title,
.chart-title,
.detail-sheet-title {
  font-size: 34rpx;
}

.stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 24rpx;
}

.stat-value {
  font-size: 42rpx;
  font-weight: 800;
  color: #111827;
}

.stat-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.mini-ultimate-card {
  padding: 24rpx 28rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, rgba(245, 243, 255, 0.92), rgba(255, 255, 255, 0.9));
}

.group-board {
  border-radius: 30rpx;
  padding: 24rpx;
}

.group-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 22rpx;
}

.group-toggle-text {
  line-height: 1;
  font-weight: 700;
}

.group-toggle-arrow {
  line-height: 1;
  font-size: 20rpx;
  transform: rotate(180deg);
  transition: transform 0.24s ease;
}

.group-toggle.expanded .group-toggle-arrow {
  transform: rotate(0deg);
}

.group-body {
  margin-top: 20rpx;
}

.group-empty {
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 24rpx;
  background: rgba(248, 250, 252, 0.76);
}

.chart-panel {
  align-items: stretch;
}

.chart-board {
  width: 100%;
  border-radius: 36rpx;
  padding: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(120, 104, 84, 0.12);
  box-shadow: 0 18rpx 48rpx rgba(44, 35, 20, 0.08);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.chart-hero {
  display: grid;
  grid-template-columns: 180rpx minmax(0, 1fr) 180rpx;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 8rpx 28rpx;
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.16);
}

.chart-hero-side {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.chart-zoom-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.chart-hero-side-right {
  align-items: flex-end;
  text-align: right;
}

.chart-zoom-chip,
.chart-density-chip,
.timeline-stage-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.chart-zoom-chip {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.12);
}

.chart-zoom-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #2563eb;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(37, 99, 235, 0.24);
  box-shadow: 0 10rpx 24rpx rgba(37, 99, 235, 0.08);
}

.chart-density-chip {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.12);
}

.chart-zoom-tip,
.chart-range-tip {
  font-size: 22rpx;
  line-height: 1.6;
  color: #64748b;
}

.chart-hero-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.chart-hero-label {
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: #7c3aed;
}

.chart-hero-title {
  margin-top: 14rpx;
  font-size: 38rpx;
  line-height: 1.4;
  font-weight: 800;
  color: #111827;
}

.chart-hero-progress {
  margin-top: 12rpx;
  max-width: 100%;
  font-size: 25rpx;
  line-height: 1.8;
  color: #475569;
}

.chart-progress-track {
  width: 100%;
  max-width: 420rpx;
  height: 14rpx;
  margin-top: 18rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.18);
}

.chart-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb 0%, #7c3aed 55%, #16a34a 100%);
}

.chart-progress-meta {
  width: 100%;
  max-width: 460rpx;
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  font-size: 22rpx;
  color: #64748b;
}

.chart-empty-state {
  text-align: center;
  padding: 100rpx 36rpx;
}

.chart-icon {
  font-size: 88rpx;
  color: #7c3aed;
}

.chart-title {
  margin-top: 24rpx;
}

.timeline-scroll {
  width: 100%;
  margin-top: 24rpx;
  overscroll-behavior: contain;
}

.timeline-content {
  min-height: 400rpx;
  padding-bottom: 24rpx;
}

.timeline-axis {
  position: relative;
  height: 88rpx;
  margin-bottom: 8rpx;
  padding: 0 16rpx;
  box-sizing: border-box;
}

.timeline-axis::after {
  content: '';
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  bottom: 10rpx;
  height: 2rpx;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0.45), rgba(148, 163, 184, 0.08));
}

.timeline-tick,
.timeline-today {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
}

.timeline-tick-line,
.timeline-today-line {
  position: absolute;
  top: 24rpx;
  bottom: 10rpx;
  width: 2rpx;
  background: rgba(148, 163, 184, 0.18);
}

.timeline-tick-label,
.timeline-today-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: #64748b;
  background: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.timeline-today-line,
.timeline-grid-line.today {
  background: linear-gradient(180deg, rgba(124, 58, 237, 0.8), rgba(37, 99, 235, 0.65));
}

.timeline-today-label {
  color: #7c3aed;
  font-weight: 700;
}

.timeline-stage {
  margin-top: 22rpx;
}

.timeline-stage-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 14rpx;
}

.timeline-stage-head.simple {
  justify-content: flex-end;
}

.timeline-stage-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #0f172a;
}

.timeline-stage-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.7;
  color: #64748b;
}

.timeline-stage-count {
  color: #0f172a;
  background: rgba(241, 245, 249, 0.95);
}

.timeline-stage-body {
  position: relative;
  border-radius: 28rpx;
  padding: 0 16rpx;
  overflow: visible;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.96));
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.timeline-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2rpx;
  transform: translateX(-50%);
  background: rgba(148, 163, 184, 0.08);
}

.timeline-stage-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.timeline-goal-card {
  position: absolute;
  padding: 20rpx 22rpx 18rpx 26rpx;
  border-radius: 24rpx;
  border: 1rpx solid transparent;
  box-sizing: border-box;
  overflow: visible;
}

.timeline-goal-card.tappable {
  cursor: pointer;
}

.timeline-goal-card.active {
  z-index: 3;
}

.timeline-goal-card.doing {
  border-color: rgba(37, 99, 235, 0.18);
}

.timeline-goal-card.completed {
  border-color: rgba(22, 163, 74, 0.18);
}

.timeline-goal-card.abandoned {
  border-color: rgba(220, 38, 38, 0.18);
}

.timeline-goal-card.compact {
  padding-top: 18rpx;
  padding-bottom: 16rpx;
}

.timeline-goal-card.compact .timeline-goal-deadline,
.timeline-goal-card.compact .timeline-goal-extra {
  display: none;
}

.timeline-goal-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 10rpx;
  border-radius: 24rpx 0 0 24rpx;
}

.timeline-goal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.timeline-goal-title {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.45;
  font-weight: 800;
  color: #111827;
}

.timeline-goal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  white-space: nowrap;
}

.timeline-goal-time,
.timeline-goal-deadline,
.timeline-goal-proof-tip {
  margin-top: 10rpx;
  font-size: 21rpx;
  line-height: 1.6;
  color: #475569;
}

.timeline-goal-extra {
  margin-top: 10rpx;
  font-size: 21rpx;
  line-height: 1.7;
  color: #64748b;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.timeline-goal-proof-tip {
  color: #7c3aed;
}

.completion-popover {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(100% + 16rpx);
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 26rpx 60rpx rgba(15, 23, 42, 0.28);
  z-index: 6;
}

.completion-popover::after {
  content: '';
  position: absolute;
  left: 40rpx;
  bottom: -14rpx;
  width: 28rpx;
  height: 28rpx;
  transform: rotate(45deg);
  background: rgba(15, 23, 42, 0.96);
}

.completion-popover-title {
  font-size: 24rpx;
  font-weight: 800;
  color: #f8fafc;
}

.completion-popover-note {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.8;
  color: rgba(248, 250, 252, 0.9);
}

.completion-image-scroll {
  margin-top: 16rpx;
  white-space: nowrap;
}

.completion-image-row {
  display: inline-flex;
  gap: 14rpx;
}

.completion-popover-image {
  width: 156rpx;
  height: 156rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.18);
}

.completion-popover-video {
  width: 100%;
  height: 260rpx;
  margin-top: 16rpx;
  border-radius: 20rpx;
  background: #020617;
}

.bottom-nav {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 24rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  padding: 20rpx 16rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(120, 104, 84, 0.12);
  box-shadow: 0 20rpx 56rpx rgba(44, 35, 20, 0.12);
  backdrop-filter: blur(16px);
  z-index: 15;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-height: 84rpx;
  color: #64748b;
}

.nav-item.active {
  color: #1d4ed8;
}

.nav-icon {
  font-size: 32rpx;
  line-height: 1;
}

.nav-label {
  font-size: 20rpx;
  line-height: 1.2;
}

.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(15, 23, 42, 0.38);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 28rpx;
}

.detail-sheet {
  width: 100%;
  max-height: 82vh;
  border-radius: 34rpx 34rpx 0 0;
  background: rgba(248, 250, 252, 0.98);
  box-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.detail-sheet-head {
  padding: 28rpx;
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.18);
}

.detail-sheet-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #64748b;
  background: rgba(255, 255, 255, 0.92);
}

.detail-sheet-body {
  max-height: calc(82vh - 112rpx);
  padding: 24rpx 24rpx 0;
  box-sizing: border-box;
}

.board-collapse-enter-active,
.board-collapse-leave-active {
  transition: all 0.24s ease;
  overflow: hidden;
}

.board-collapse-enter-from,
.board-collapse-leave-to {
  opacity: 0;
  transform: translateY(-12rpx);
}
</style>
