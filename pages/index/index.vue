<template>
  <view class="page" :class="[`theme-${currentTheme}`]">
    <view class="sidebar-trigger" :class="{ active: sidebarVisible }" @tap="toggleSidebar">
      <text class="sidebar-trigger-icon">☰</text>
    </view>

    <view v-if="sidebarVisible" class="sidebar-mask sidebar-mask-enter" @tap="closeSidebar">
      <view class="sidebar-drawer sidebar-drawer-enter" @tap.stop>
        <view class="sidebar-head">
          <view class="sidebar-title">功能菜单</view>
          <view class="sidebar-close" @tap="closeSidebar">×</view>
        </view>

        <view class="sidebar-option" @tap="openThemeSheet">
          <view>
            <view class="sidebar-option-title">更改主题</view>
            <view class="sidebar-option-desc">当前主题：{{ currentThemeLabel }}</view>
          </view>
          <text class="sidebar-option-arrow">›</text>
        </view>

        <view class="sidebar-option" @tap="openContactUs">
          <view>
            <view class="sidebar-option-title">联系我们</view>
            <view class="sidebar-option-desc">查看反馈与联系说明</view>
          </view>
          <text class="sidebar-option-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="page-shell">
      <view v-if="activeTab === 'home'" :class="['tab-panel', 'home-panel', tabSwitchClass]">
        <view class="floating-board ultimate-board">
          <view class="board-label-row">
            <text class="board-label">终极目标</text>
          </view>

          <template v-if="ultimateRootGoal">
            <view class="ultimate-title-row" @tap="openDetail(ultimateRootGoal)">
              <view>
                <view class="ultimate-title">{{ ultimateRootGoal.title }}</view>
                <view class="ultimate-date">到期日期：{{ formatDate(ultimateRootGoal.endTime) }}</view>
              </view>
            </view>

            <view class="ultimate-progress-wrap">
              <view class="ultimate-progress-label">当前进度</view>
              <view class="ultimate-progress-text">{{ ultimateRootGoal.currentProgress || '暂未记录，点击右上角可立即补充进度。' }}</view>
            </view>

            <view class="ultimate-meta-grid single-column">
              <view class="meta-box">
                <text class="meta-box-label">时间状态</text>
                <text class="meta-box-value emphasis">{{ ultimateTimelineText }}</text>
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
                  <GoalFocusTree :goal="goal" @select="openDetail" @status-change="changeStatus" />
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

      <view v-else-if="activeTab === 'list'" :class="['tab-panel', 'list-panel', tabSwitchClass]">
        <view class="overview-board">
          <view class="overview-head">
            <view>
              <view class="overview-title">目标列表</view>
              <view class="overview-subtitle">查看、编辑并分组管理全部目标与子目标</view>
            </view>
            <view class="overview-actions">
              <view class="overview-action" @tap="openCreateRoot">
                <text class="overview-action-icon">＋</text>
                <text>新增目标</text>
              </view>
              <view class="overview-secondary-action" @tap="openUltimateGoal">
                <text>{{ ultimateButtonText }}</text>
              </view>
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
                :show-edit="group.key === 'doing'"
                :show-delete="group.key === 'completed' || group.key === 'abandoned'"
                :show-add-child="group.key === 'doing'"
                :show-status-actions="group.key === 'doing' || group.key === 'abandoned'"
                :show-children="group.key === 'doing'"
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
        :class="['tab-panel', 'chart-panel', tabSwitchClass]"
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
            @touchstart="handleChartTouchStart"
            @touchmove="handleChartTouchMove"
            @touchend="handleChartTouchEnd"
            @touchcancel="handleChartTouchEnd"
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
                    :data-goal-id="item.id"
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
                      {{ activeProofGoalId === item.id ? '点击收起完成成果' : '点击展开完成成果' }}
                    </view>

                    <view v-if="item.status === 'completed' && activeProofGoalId === item.id" class="completion-popover" @tap.stop>
                      <view class="completion-popover-title">完成成果</view>

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

    <view class="effect-overlay">
      <view
        v-for="burst in fireworks"
        :key="burst.id"
        class="firework-burst"
        :style="{ left: burst.x, top: burst.y, animationDelay: burst.delay + 'ms' }"
      >
        <view
          v-for="particle in burst.particles"
          :key="particle.id"
          class="firework-particle"
          :style="particle.style"
        ></view>
      </view>

      <view
        v-for="piece in shatterPieces"
        :key="piece.id"
        class="shatter-piece"
        :style="piece.style"
      ></view>
    </view>

    <view v-if="detailVisible" class="detail-mask" @tap="closeDetail">
      <view class="detail-sheet detail-sheet-enter" @tap.stop>
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
            :show-delete="false"
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
import { formatDate, formatRemainingTime, formatUltimateTimelineText, getStatusMeta, sortGoalsByRemainingTime } from '../../utils/goalUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CHART_ZOOM = 1;
const MIN_CHART_ZOOM = 0.1;
const MAX_CHART_ZOOM = 2.4;
const THEME_STORAGE_KEY = 'goal_theme_preference';
const WINDOW_WIDTH = uni.getSystemInfoSync ? uni.getSystemInfoSync().windowWidth || 375 : 375;
const WINDOW_HEIGHT = uni.getSystemInfoSync ? uni.getSystemInfoSync().windowHeight || 812 : 812;
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
const sidebarVisible = ref(false);
const detailVisible = ref(false);
const tabSwitchClass = ref('tab-motion-none');
const selectedGoalId = ref('');
const chartPanelRef = ref(null);
const timelineScrollRef = ref(null);
const timelineScrollLeft = ref(0);
const chartZoom = ref(DEFAULT_CHART_ZOOM);
const currentTheme = ref(loadStoredTheme());
const activeProofGoalId = ref('');
const fireworks = ref([]);
const shatterPieces = ref([]);
const pinchState = reactive({
  active: false,
  startDistance: 0,
  startZoom: 1,
});
const effectTimers = [];
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
const ultimateTimelineText = computed(() => formatUltimateTimelineText(ultimateRootGoal.value?.startTime, ultimateRootGoal.value?.endTime));
const currentThemeLabel = computed(() => (currentTheme.value === 'dusk' ? '暮色主题' : '明亮主题'));
const focusGoalTrees = computed(() => sortGoalTree(filterDoingGoalTree(regularGoals.value)));
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
      goals: sortGoalTree(filterDoingGoalTree(regularGoals.value)),
    },
    {
      key: 'completed',
      label: '已完成',
      desc: '查看已经完成的目标记录与成果内容。',
      count: allGoals.value.filter((goal) => goal.status === 'completed' && !goal.isUltimate).length,
      goals: buildFlatGroupGoals('completed'),
    },
    {
      key: 'abandoned',
      label: '已放弃',
      desc: '集中查看已放弃目标，便于删除或复盘。',
      count: allGoals.value.filter((goal) => goal.status === 'abandoned' && !goal.isUltimate && !goal.parentId).length,
      goals: buildFlatGroupGoals('abandoned'),
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

function filterDoingGoalTree(goals) {
  const walk = (items) => {
    return (items || []).reduce((result, goal) => {
      const children = goal.children && goal.children.length ? walk(goal.children) : [];

      if (goal.status === 'doing') {
        result.push({
          ...goal,
          children,
        });
        return result;
      }

      if (children.length) {
        result.push(...children);
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

function buildFlatGroupGoals(status) {
  return sortGoalsByRemainingTime(
    regularFlatGoals.value
      .filter((goal) => goal.status === status && (status !== 'abandoned' || !goal.parentId))
      .map((goal) => {
        const parentGoal = goal.parentId ? allGoals.value.find((item) => item.id === goal.parentId) : null;
        return {
          ...goal,
          children: [],
          parentGoalTitle: parentGoal?.title || '',
        };
      })
  );
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

function loadStoredTheme() {
  try {
    const storedTheme = uni.getStorageSync(THEME_STORAGE_KEY);
    return storedTheme === 'dusk' ? 'dusk' : 'light';
  } catch (error) {
    return 'light';
  }
}

function setTheme(theme) {
  const nextTheme = theme === 'dusk' ? 'dusk' : 'light';
  currentTheme.value = nextTheme;

  try {
    uni.setStorageSync(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    // ignore storage errors
  }
}

function scheduleEffectCleanup(callback, delay = 0) {
  const timer = setTimeout(() => {
    const timerIndex = effectTimers.indexOf(timer);
    if (timerIndex >= 0) {
      effectTimers.splice(timerIndex, 1);
    }
    callback();
  }, delay);

  effectTimers.push(timer);
  return timer;
}

function createEffectId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getViewportWidth() {
  if (typeof window !== 'undefined' && window.innerWidth) {
    return window.innerWidth;
  }

  return WINDOW_WIDTH;
}

function getViewportHeight() {
  if (typeof window !== 'undefined' && window.innerHeight) {
    return window.innerHeight;
  }

  return WINDOW_HEIGHT;
}

function resolveGoalElement(goalId) {
  if (!HAS_DOM_QUERY || !goalId) {
    return null;
  }

  const candidates = Array.from(document.querySelectorAll('[data-goal-id]'));
  return candidates.find((element) => String(element.getAttribute('data-goal-id')) === String(goalId)) || null;
}

function getGoalEffectAnchor(goalId) {
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();
  const element = resolveGoalElement(goalId);

  if (!element || typeof element.getBoundingClientRect !== 'function') {
    return {
      element: null,
      rect: null,
      x: '50%',
      y: '34%',
    };
  }

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return {
    element,
    rect,
    x: `${(centerX / viewportWidth) * 100}%`,
    y: `${(centerY / viewportHeight) * 100}%`,
  };
}

function triggerFireworks(goalId) {
  const anchor = getGoalEffectAnchor(goalId);
  const nextBursts = Array.from({ length: 4 }, (_, burstIndex) => {
    const burstId = createEffectId('firework');
    const offsetX = randomBetween(-10, 10);
    const offsetY = randomBetween(-8, 8);
    const particles = Array.from({ length: 14 }, (_, particleIndex) => {
      const angle = (Math.PI * 2 * particleIndex) / 14 + randomBetween(-0.12, 0.12);
      const distance = randomBetween(70, 170);
      const size = randomBetween(10, 18);
      const palette = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

      return {
        id: `${burstId}_${particleIndex}`,
        style: {
          '--particle-size': `${size}rpx`,
          '--particle-color': palette[particleIndex % palette.length],
          '--particle-x': `${Math.cos(angle) * distance}rpx`,
          '--particle-y': `${Math.sin(angle) * distance}rpx`,
          '--particle-rotate': `${randomBetween(-220, 220)}deg`,
          animationDelay: `${burstIndex * 120}ms`,
        },
      };
    });

    return {
      id: burstId,
      x: `calc(${anchor.x} + ${offsetX}%)`,
      y: `calc(${anchor.y} + ${offsetY}%)`,
      delay: burstIndex * 120,
      particles,
    };
  });

  fireworks.value = [...fireworks.value, ...nextBursts];

  scheduleEffectCleanup(() => {
    const burstIds = nextBursts.map((item) => item.id);
    fireworks.value = fireworks.value.filter((item) => !burstIds.includes(item.id));
  }, 1800);
}

function triggerGoalShatter(goalId, onComplete) {
  const anchor = getGoalEffectAnchor(goalId);

  if (!anchor.rect) {
    onComplete?.();
    return;
  }

  const { rect, element } = anchor;
  const rows = 3;
  const columns = 3;
  const pieceWidth = rect.width / columns;
  const pieceHeight = rect.height / rows;
  const nextPieces = [];

  if (element && element.style) {
    element.style.transition = 'opacity 0.42s ease, transform 0.42s ease, filter 0.42s ease';
    element.style.opacity = '0';
    element.style.transform = 'scale(0.92)';
    element.style.filter = 'blur(10px)';
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      nextPieces.push({
        id: createEffectId('shatter'),
        style: {
          left: `${rect.left + pieceWidth * column}px`,
          top: `${rect.top + pieceHeight * row}px`,
          width: `${pieceWidth}px`,
          height: `${pieceHeight}px`,
          '--shatter-x': `${randomBetween(-120, 120)}rpx`,
          '--shatter-y': `${randomBetween(-140, 160)}rpx`,
          '--shatter-r': `${randomBetween(-150, 150)}deg`,
          '--shatter-delay': `${(row + column) * 24}ms`,
          '--shatter-bg': currentTheme.value === 'dusk'
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.88))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.92))',
        },
      });
    }
  }

  shatterPieces.value = [...shatterPieces.value, ...nextPieces];

  scheduleEffectCleanup(() => {
    const pieceIds = nextPieces.map((item) => item.id);
    shatterPieces.value = shatterPieces.value.filter((item) => !pieceIds.includes(item.id));

    if (element && element.style) {
      element.style.opacity = '';
      element.style.transform = '';
      element.style.filter = '';
      element.style.transition = '';
    }

    onComplete?.();
  }, 460);
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
    return `${year}`;
  }

  if (mode === 'compact') {
    return `${year}.${month}`;
  }

  if (mode === 'detail') {
    if (month === 1 && day === 1) {
      return `${year}.1.1`;
    }

    return `${month}.${day}`;
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
    extraText: goal.purpose || goal.achieveMethod || goal.content || '',
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
        background: currentTheme.value === 'dusk'
          ? `linear-gradient(135deg, ${item.color}22, rgba(15,23,42,0.96))`
          : `linear-gradient(135deg, ${item.color}14, rgba(255,255,255,0.98))`,
        boxShadow: activeProofGoalId.value === item.id
          ? `0 24rpx 56rpx ${item.color}2A`
          : (currentTheme.value === 'dusk' ? '0 16rpx 36rpx rgba(2, 6, 23, 0.28)' : '0 16rpx 36rpx rgba(15, 23, 42, 0.08)'),
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
  const tabOrder = ['home', 'list', 'chart'];
  const previousIndex = tabOrder.indexOf(activeTab.value);
  const nextIndex = tabOrder.indexOf(tab);

  if (activeTab.value === tab) {
    tabSwitchClass.value = 'tab-bounce';
    setTimeout(() => {
      tabSwitchClass.value = 'tab-motion-none';
    }, 420);
    return;
  }

  tabSwitchClass.value = nextIndex >= previousIndex ? 'tab-slide-left' : 'tab-slide-right';
  activeTab.value = tab;
  activeProofGoalId.value = '';

  setTimeout(() => {
    if (tabSwitchClass.value !== 'tab-bounce') {
      tabSwitchClass.value = 'tab-motion-none';
    }
  }, 420);
}

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}

function closeSidebar() {
  sidebarVisible.value = false;
}

function openThemeSheet() {
  closeSidebar();
  uni.showActionSheet({
    itemList: ['明亮主题', '暮色主题'],
    success: (res) => {
      setTheme(res.tapIndex === 1 ? 'dusk' : 'light');
    },
  });
}

function openContactUs() {
  closeSidebar();
  uni.showModal({
    title: '联系我们',
    content: '如果你有建议或使用问题，可通过当前应用维护渠道联系开发者进行反馈。',
    showCancel: false,
    confirmText: '知道了',
  });
}

function toggleGroup(key) {
  groupExpanded[key] = !groupExpanded[key];
}

function openDetail(goal) {
  if (!goal || goal.status === 'completed' || goal.status === 'abandoned') {
    return;
  }

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

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  if (typeof event.stopPropagation === 'function') {
    event.stopPropagation();
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

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  if (typeof event.stopPropagation === 'function') {
    event.stopPropagation();
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

  effectTimers.forEach((timer) => clearTimeout(timer));
  effectTimers.length = 0;
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
  if (!goal || goal.status === 'completed' || goal.status === 'abandoned') {
    return;
  }

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
  let effectGoalId = '';

  if (dialog.mode === 'complete' && dialog.initialValue && dialog.initialValue.id) {
    effectGoalId = dialog.initialValue.id;
    const result = setGoalStatus(dialog.initialValue.id, 'completed', form);
    success = Boolean(result?.success);
  } else if ((dialog.mode === 'edit' || dialog.mode === 'ultimate') && dialog.initialValue && dialog.initialValue.id) {
    success = editGoal(dialog.initialValue.id, form);
  } else if (dialog.mode === 'child' && dialog.parentGoalId) {
    success = addSubGoal(dialog.parentGoalId, form);
  } else {
    success = addGoal(form);
  }

  if (!success) {
    const title = dialog.mode === 'complete'
      ? '请至少填写一项完成成果'
      : '终极目标只允许设置一个，请直接编辑已有终极目标';
    uni.showToast({ title, icon: 'none' });
    return;
  }

  closeDialog();

  if (dialog.mode === 'complete' && effectGoalId) {
    triggerFireworks(effectGoalId);
  }
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

  if (payload.status === 'abandoned') {
    const hasChildren = payload.goal.children && payload.goal.children.length;
    const isChildGoal = Boolean(payload.goal.parentId);
    const content = isChildGoal
      ? '确认要放弃子目标「' + payload.goal.title + '」吗？当前子目标数据会被清除。'
      : (hasChildren
        ? '确认要放弃「' + payload.goal.title + '」吗？坚持坚持，再加把劲！其子目标会被一并清空。'
        : '确认要放弃「' + payload.goal.title + '」吗？坚持坚持，再加把劲！');

    uni.showModal({
      title: '确认放弃目标',
      content,
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          triggerGoalShatter(payload.goal.id, () => {
            const result = setGoalStatus(payload.goal.id, payload.status);
            if (result?.action === 'deleted' && selectedGoalId.value === payload.goal.id) {
              closeDetail();
            }
          });
        }
      },
    });
    return;
  }

  const result = setGoalStatus(payload.goal.id, payload.status);
  if (result?.action === 'deleted' && selectedGoalId.value === payload.goal.id) {
    closeDetail();
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  padding-top: calc(28rpx + var(--app-safe-top));
  padding-bottom: calc(188rpx + var(--app-safe-bottom));
  position: relative;
  color: var(--theme-text-primary);
  background: var(--theme-page-bg);
  transition: background 0.24s ease, color 0.24s ease;
  --theme-page-bg: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  --theme-board-bg: rgba(255, 255, 255, 0.72);
  --theme-board-sub-bg: rgba(255, 255, 255, 0.62);
  --theme-board-border: rgba(120, 104, 84, 0.12);
  --theme-board-shadow: 0 22rpx 62rpx rgba(44, 35, 20, 0.1);
  --theme-text-primary: #111827;
  --theme-text-secondary: #6b7280;
  --theme-nav-bg: rgba(255, 255, 255, 0.72);
  --theme-nav-border: rgba(120, 104, 84, 0.12);
  --theme-nav-shadow: 0 24rpx 60rpx rgba(44, 35, 20, 0.14);
  --theme-nav-color: #64748b;
  --theme-nav-active: #1d4ed8;
  --theme-sheet-bg: rgba(248, 250, 252, 0.78);
  --theme-sheet-shadow: 0 -20rpx 60rpx rgba(15, 23, 42, 0.16);
  --theme-drawer-bg: rgba(255, 255, 255, 0.78);
  --theme-drawer-shadow: 0 28rpx 80rpx rgba(15, 23, 42, 0.18);
  --theme-board-strong-bg: linear-gradient(135deg, rgba(245, 243, 255, 0.82), rgba(255, 255, 255, 0.66));
  --theme-focus-card-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(241, 245, 249, 0.72));
  --theme-ultimate-board-bg: linear-gradient(135deg, rgba(237, 233, 254, 0.86), rgba(255, 255, 255, 0.72));
  --theme-progress-bg: rgba(255, 255, 255, 0.58);
  --theme-chip-bg: rgba(255, 255, 255, 0.72);
  --theme-chip-text: #334155;
  --theme-chart-board-bg: rgba(255, 255, 255, 0.74);
  --theme-chart-stage-bg: linear-gradient(180deg, rgba(248, 250, 252, 0.8), rgba(255, 255, 255, 0.72));
  --theme-chart-reset-bg: rgba(255, 255, 255, 0.72);
  --theme-card-title: #111827;
  --theme-card-text: #475569;
  --theme-muted-text: #64748b;
  --theme-plain-bg: rgba(248, 250, 252, 0.64);
  --theme-success-bg: rgba(240, 253, 244, 0.96);
  --theme-success-border: rgba(34, 197, 94, 0.24);
  --theme-success-text: #166534;
  --theme-danger-bg: rgba(254, 242, 242, 0.96);
  --theme-danger-border: rgba(239, 68, 68, 0.24);
  --theme-danger-text: #b91c1c;
  --theme-primary-soft-bg: rgba(239, 246, 255, 0.96);
  --theme-primary-soft-border: rgba(59, 130, 246, 0.24);
  --theme-primary-soft-text: #1d4ed8;
}

.page.theme-dusk {
  --theme-page-bg: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
  --theme-board-bg: rgba(15, 23, 42, 0.72);
  --theme-board-sub-bg: rgba(30, 41, 59, 0.62);
  --theme-board-border: rgba(148, 163, 184, 0.16);
  --theme-board-shadow: 0 22rpx 64rpx rgba(2, 6, 23, 0.34);
  --theme-text-primary: #e2e8f0;
  --theme-text-secondary: #94a3b8;
  --theme-nav-bg: rgba(15, 23, 42, 0.72);
  --theme-nav-border: rgba(148, 163, 184, 0.16);
  --theme-nav-shadow: 0 24rpx 60rpx rgba(2, 6, 23, 0.36);
  --theme-nav-color: #94a3b8;
  --theme-nav-active: #c4b5fd;
  --theme-sheet-bg: rgba(15, 23, 42, 0.8);
  --theme-sheet-shadow: 0 -20rpx 60rpx rgba(2, 6, 23, 0.42);
  --theme-drawer-bg: rgba(15, 23, 42, 0.8);
  --theme-drawer-shadow: 0 28rpx 80rpx rgba(2, 6, 23, 0.38);
  --theme-board-strong-bg: linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.72));
  --theme-focus-card-bg: linear-gradient(135deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.72));
  --theme-ultimate-board-bg: linear-gradient(135deg, rgba(49, 46, 129, 0.36), rgba(15, 23, 42, 0.8));
  --theme-progress-bg: rgba(30, 41, 59, 0.58);
  --theme-chip-bg: rgba(30, 41, 59, 0.68);
  --theme-chip-text: #cbd5e1;
  --theme-chart-board-bg: rgba(15, 23, 42, 0.74);
  --theme-chart-stage-bg: linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.72));
  --theme-chart-reset-bg: rgba(30, 41, 59, 0.7);
  --theme-card-title: #e2e8f0;
  --theme-card-text: #cbd5e1;
  --theme-muted-text: #94a3b8;
  --theme-plain-bg: rgba(30, 41, 59, 0.62);
  --theme-success-bg: rgba(20, 83, 45, 0.34);
  --theme-success-border: rgba(74, 222, 128, 0.3);
  --theme-success-text: #86efac;
  --theme-danger-bg: rgba(127, 29, 29, 0.34);
  --theme-danger-border: rgba(248, 113, 113, 0.28);
  --theme-danger-text: #fca5a5;
  --theme-primary-soft-bg: rgba(30, 64, 175, 0.28);
  --theme-primary-soft-border: rgba(96, 165, 250, 0.28);
  --theme-primary-soft-text: #93c5fd;
}

.page::before,
.page::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(32rpx);
  animation: ambientFloat 7.6s ease-in-out infinite alternate;
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

.page-shell {
  padding-top: 96rpx;
}

.tab-motion-none {
  animation: none;
}

.tab-slide-left {
  animation: panelSlideLeft 0.42s var(--app-ease-spring);
}

.tab-slide-right {
  animation: panelSlideRight 0.42s var(--app-ease-spring);
}

.tab-bounce {
  animation: tabBounce 0.42s var(--app-ease-bounce);
}

.sidebar-trigger {
  position: fixed;
  left: 28rpx;
  bottom: calc(132rpx + var(--app-safe-bottom));
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-drawer-bg);
  border: 1rpx solid var(--theme-board-border);
  box-shadow: var(--theme-board-shadow);
  backdrop-filter: blur(var(--app-blur-strong));
  z-index: 20;
}

.sidebar-trigger.active {
  transform: translateY(-8rpx) scale(1.05);
  box-shadow: 0 24rpx 56rpx rgba(37, 99, 235, 0.18);
}

.sidebar-trigger-icon {
  font-size: 34rpx;
  line-height: 1;
  color: var(--theme-text-primary);
}

.sidebar-mask {
  position: fixed;
  inset: 0;
  z-index: 24;
  display: flex;
  justify-content: flex-start;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(var(--app-blur-soft));
}

.sidebar-mask-enter {
  animation: fadeInSoft 0.28s ease;
}

.sidebar-drawer {
  width: 520rpx;
  max-width: calc(100vw - 96rpx);
  min-height: 100vh;
  padding: calc(36rpx + var(--app-safe-top)) 28rpx 36rpx;
  box-sizing: border-box;
  background: var(--theme-drawer-bg);
  box-shadow: var(--theme-drawer-shadow);
  border-radius: 0 var(--app-radius-xl) var(--app-radius-xl) 0;
  backdrop-filter: blur(var(--app-blur-strong));
}

.sidebar-drawer-enter {
  animation: slideDrawerIn 0.38s var(--app-ease-spring);
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.sidebar-title {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--theme-text-primary);
}

.sidebar-close {
  width: 60rpx;
  height: 60rpx;
  border-radius: var(--app-radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: var(--theme-text-secondary);
  background: rgba(148, 163, 184, 0.12);
}

.sidebar-option {
  margin-top: 24rpx;
  padding: 26rpx 22rpx;
  border-radius: var(--app-radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  background: var(--theme-board-sub-bg);
  border: 1rpx solid var(--theme-board-border);
  backdrop-filter: blur(var(--app-blur-soft));
}

.sidebar-option:active {
  transform: translateX(10rpx) scale(0.99);
}

.sidebar-option-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.sidebar-option-desc {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.sidebar-option-arrow {
  font-size: 34rpx;
  color: var(--theme-text-secondary);
}

.tab-panel {
  min-height: calc(100vh - 240rpx);
}

.floating-board,
.overview-board,
.group-board,
.mini-ultimate-card,
.chart-placeholder {
  background: var(--theme-board-bg);
  border: 1rpx solid var(--theme-board-border);
  box-shadow: var(--theme-board-shadow);
  backdrop-filter: blur(var(--app-blur-strong));
  animation: boardFloatIn 0.5s var(--app-ease-spring) both;
}

.floating-board,
.overview-board,
.chart-placeholder {
  border-radius: var(--app-radius-lg);
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

.overview-action,
.overview-secondary-action,
.panel-empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 14rpx 34rpx rgba(37, 99, 235, 0.12);
}

.overview-action:active,
.overview-secondary-action:active,
.panel-empty-btn:active {
  transform: translateY(6rpx) scale(0.97);
}

.overview-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14rpx;
}

.overview-action {
  gap: 10rpx;
  padding: 18rpx 30rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  box-shadow: 0 16rpx 36rpx rgba(37, 99, 235, 0.28);
}

.overview-secondary-action {
  padding: 14rpx 26rpx;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.1);
}

.overview-action-icon {
  font-size: 28rpx;
  line-height: 1;
  font-weight: 800;
}

.ultimate-board {
  background: var(--theme-ultimate-board-bg);
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
  color: var(--theme-card-title);
}

.ultimate-date {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
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
  border-radius: var(--app-radius-md);
  background: var(--theme-progress-bg);
  backdrop-filter: blur(var(--app-blur-soft));
}

.ultimate-progress-label,
.meta-box-label,
.focus-metric-label,
.mini-ultimate-label {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.ultimate-progress-text {
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-card-text);
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

.ultimate-meta-grid.single-column {
  grid-template-columns: minmax(0, 1fr);
}

.meta-box,
.focus-metric,
.stat-card {
  padding: 22rpx;
  border-radius: var(--app-radius-sm);
  background: var(--theme-board-sub-bg);
  backdrop-filter: blur(var(--app-blur-soft));
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
  color: var(--theme-text-primary);
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
  color: var(--theme-text-secondary);
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

.carousel-board {
  min-height: calc(100vh - 520rpx);
}

.goal-swiper {
  height: calc(100vh - 620rpx);
  min-height: 720rpx;
  margin-top: 24rpx;
}

.focus-card-scroll {
  height: 100%;
}

.focus-card {
  min-height: 100%;
  padding: 8rpx;
  border-radius: var(--app-radius-md);
  background: var(--theme-focus-card-bg);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(var(--app-blur-soft));
  animation: focusCardZoomIn 0.42s var(--app-ease-spring) both;
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
  color: var(--theme-card-title);
}

.stat-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
}

.mini-ultimate-card {
  padding: 24rpx 28rpx;
  border-radius: var(--app-radius-md);
  background: var(--theme-board-strong-bg);
}

.group-board {
  border-radius: var(--app-radius-md);
  padding: 24rpx;
}

.group-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: var(--theme-chip-bg);
  color: var(--theme-chip-text);
  font-size: 22rpx;
  backdrop-filter: blur(var(--app-blur-soft));
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
  animation: pullDownSoft 0.34s var(--app-ease-spring);
}

.group-empty {
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: var(--app-radius-sm);
  background: var(--theme-plain-bg);
  backdrop-filter: blur(var(--app-blur-soft));
}

.chart-panel {
  align-items: stretch;
}

.chart-board {
  width: 100%;
  border-radius: var(--app-radius-lg);
  padding: 28rpx;
  background: var(--theme-chart-board-bg);
  border: 1rpx solid var(--theme-board-border);
  box-shadow: var(--theme-board-shadow);
  backdrop-filter: blur(var(--app-blur-strong));
  overflow: hidden;
  animation: boardFloatIn 0.52s var(--app-ease-spring) both;
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
  background: var(--theme-chart-reset-bg);
  border: 1rpx solid rgba(37, 99, 235, 0.24);
  box-shadow: 0 10rpx 24rpx rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(var(--app-blur-soft));
}

.chart-density-chip {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.12);
}

.chart-zoom-tip,
.chart-range-tip {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-muted-text);
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
  color: var(--theme-card-title);
}

.chart-hero-progress {
  margin-top: 12rpx;
  max-width: 100%;
  font-size: 25rpx;
  line-height: 1.8;
  color: var(--theme-card-text);
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
  color: var(--theme-muted-text);
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
  scroll-behavior: smooth;
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
  color: var(--theme-muted-text);
  background: var(--theme-chip-bg);
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
  color: var(--theme-card-title);
}

.timeline-stage-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--theme-muted-text);
}

.timeline-stage-count {
  color: var(--theme-card-title);
  background: var(--theme-chip-bg);
}

.timeline-stage-body {
  position: relative;
  border-radius: var(--app-radius-md);
  padding: 0 16rpx;
  overflow: visible;
  background: var(--theme-chart-stage-bg);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(var(--app-blur-soft));
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
  border-radius: var(--app-radius-sm);
  border: 1rpx solid transparent;
  box-sizing: border-box;
  overflow: visible;
  backdrop-filter: blur(var(--app-blur-soft));
  animation: timelineCardIn 0.4s var(--app-ease-spring) both;
}

.timeline-goal-card.tappable {
  cursor: pointer;
}

.timeline-goal-card.active {
  z-index: 3;
  transform: translateY(-8rpx) scale(1.02);
  box-shadow: 0 22rpx 50rpx rgba(15, 23, 42, 0.16);
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
  color: var(--theme-card-title);
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
  color: var(--theme-card-text);
}

.timeline-goal-extra {
  margin-top: 10rpx;
  font-size: 21rpx;
  line-height: 1.7;
  color: var(--theme-muted-text);
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
  border-radius: var(--app-radius-sm);
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 26rpx 60rpx rgba(15, 23, 42, 0.28);
  z-index: 6;
  animation: popFromBottom 0.32s var(--app-ease-bounce);
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
  bottom: calc(24rpx + var(--app-safe-bottom));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  padding: 20rpx 16rpx;
  border-radius: var(--app-radius-lg);
  background: var(--theme-nav-bg);
  border: 1rpx solid var(--theme-nav-border);
  box-shadow: var(--theme-nav-shadow);
  backdrop-filter: blur(var(--app-blur-strong));
  z-index: 15;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-height: 84rpx;
  color: var(--theme-nav-color);
  border-radius: var(--app-radius-sm);
}

.nav-item.active {
  color: var(--theme-nav-active);
  transform: translateY(-8rpx) scale(1.03);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04));
}

.nav-item:active {
  transform: translateY(2rpx) scale(0.97);
}

.effect-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  overflow: hidden;
}

.firework-burst,
.shatter-piece {
  position: fixed;
}

.firework-burst {
  width: 0;
  height: 0;
}

.firework-particle {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--particle-size);
  height: var(--particle-size);
  margin-left: calc(var(--particle-size) * -0.5);
  margin-top: calc(var(--particle-size) * -0.5);
  border-radius: 999rpx;
  background: var(--particle-color);
  box-shadow: 0 0 24rpx var(--particle-color);
  animation: fireworkParticle 1.2s ease-out forwards;
}

.shatter-piece {
  border-radius: 10rpx;
  background: var(--shatter-bg);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 14rpx 30rpx rgba(15, 23, 42, 0.14);
  animation: shatterParticle 0.46s ease-in forwards;
  animation-delay: var(--shatter-delay);
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
  backdrop-filter: blur(var(--app-blur-soft));
  animation: fadeInSoft 0.24s ease;
}

.detail-sheet {
  width: 100%;
  max-height: 82vh;
  border-radius: var(--app-radius-xl) var(--app-radius-xl) 0 0;
  background: var(--theme-sheet-bg);
  box-shadow: var(--theme-sheet-shadow);
  overflow: hidden;
  backdrop-filter: blur(var(--app-blur-strong));
}

.detail-sheet-enter {
  animation: sheetRise 0.4s var(--app-ease-spring);
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
  color: var(--theme-muted-text);
  background: var(--theme-chip-bg);
  backdrop-filter: blur(var(--app-blur-soft));
}

.detail-sheet-body {
  max-height: calc(82vh - 112rpx);
  padding: 24rpx 24rpx 0;
  box-sizing: border-box;
}

.board-collapse-enter-active,
.board-collapse-leave-active {
  transition: all 0.28s var(--app-ease-spring);
  overflow: hidden;
}

.board-collapse-enter-from,
.board-collapse-leave-to {
  opacity: 0;
  transform: translateY(-14rpx) scaleY(0.96);
}

@keyframes fadeInSoft {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes ambientFloat {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    transform: translate3d(12rpx, -18rpx, 0) scale(1.08);
  }
}

@keyframes slideDrawerIn {
  0% {
    opacity: 0;
    transform: translateX(-48rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes boardFloatIn {
  0% {
    opacity: 0;
    transform: translateY(26rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes focusCardZoomIn {
  0% {
    opacity: 0;
    transform: scale(0.96);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes panelSlideLeft {
  0% {
    opacity: 0;
    transform: translateX(42rpx) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes panelSlideRight {
  0% {
    opacity: 0;
    transform: translateX(-42rpx) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes tabBounce {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.02) translateY(-6rpx);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes pullDownSoft {
  0% {
    opacity: 0;
    transform: translateY(-18rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes timelineCardIn {
  0% {
    opacity: 0;
    transform: translateY(18rpx) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes popFromBottom {
  0% {
    opacity: 0;
    transform: translateY(16rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes sheetRise {
  0% {
    opacity: 0;
    transform: translateY(54rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fireworkParticle {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.2) rotate(0deg);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--particle-x), var(--particle-y), 0) scale(0.08) rotate(var(--particle-rotate));
  }
}

@keyframes shatterParticle {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--shatter-x), var(--shatter-y), 0) rotate(var(--shatter-r)) scale(0.42);
  }
}
</style>
