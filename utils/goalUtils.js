import { GOAL_STATUS_OPTIONS } from "../common/goalConstants";

export function createGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function formatDate(value) {
  if (!value) {
    return "未设置";
  }
  const parts = String(value).split("-");
  if (parts.length !== 3) {
    return value;
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function parseDateValue(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const parts = String(value)
    .split("-")
    .map((item) => Number(item));

  if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
    return null;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0).getTime();
}

function formatDuration(ms) {
  const minutes = Math.max(1, Math.ceil(ms / (1000 * 60)));
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours} 小时`;
  }

  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return `${days} 天`;
}

export function formatDateRange(startTime, endTime) {
  if (!startTime && !endTime) {
    return "时间未设置";
  }
  if (startTime && endTime) {
    return `${formatDate(startTime)} - ${formatDate(endTime)}`;
  }
  return startTime ? `开始：${formatDate(startTime)}` : `结束：${formatDate(endTime)}`;
}

export function getRemainingMs(endTime, now = Date.now()) {
  const targetTime = parseDateValue(endTime, true);
  if (targetTime === null) {
    return Number.POSITIVE_INFINITY;
  }

  return targetTime - now;
}

export function formatRemainingTime(endTime, now = Date.now()) {
  const remainingMs = getRemainingMs(endTime, now);
  if (!Number.isFinite(remainingMs)) {
    return "未设置到期时间";
  }

  if (remainingMs < 0) {
    return `已逾期 ${formatDuration(Math.abs(remainingMs))}`;
  }

  return `剩余 ${formatDuration(remainingMs)}`;
}

export function getGoalUrgencyScore(goal, now = Date.now()) {
  return getRemainingMs(goal?.endTime, now);
}

export function sortGoalsByRemainingTime(goals, now = Date.now()) {
  return [...(goals || [])].sort((first, second) => {
    const firstScore = getGoalUrgencyScore(first, now);
    const secondScore = getGoalUrgencyScore(second, now);
    const firstFinite = Number.isFinite(firstScore);
    const secondFinite = Number.isFinite(secondScore);

    if (firstFinite && secondFinite && firstScore !== secondScore) {
      return firstScore - secondScore;
    }

    if (firstFinite && !secondFinite) {
      return -1;
    }

    if (!firstFinite && secondFinite) {
      return 1;
    }

    return String(second?.updatedAt || "").localeCompare(String(first?.updatedAt || ""));
  });
}

export function getStatusMeta(status) {
  return GOAL_STATUS_OPTIONS.find((item) => item.value === status) || GOAL_STATUS_OPTIONS[0];
}

export function hasGoalCompletionProof(goal) {
  const completionNote = typeof goal?.completionNote === "string" ? goal.completionNote.trim() : "";
  const completionImages = Array.isArray(goal?.completionImages) ? goal.completionImages.filter(Boolean) : [];
  const completionVideo = typeof goal?.completionVideo === "string" ? goal.completionVideo.trim() : "";

  return Boolean(completionNote || completionImages.length || completionVideo);
}

export function flattenGoals(goals) {
  const list = [];

  const walk = (items) => {
    items.forEach((item) => {
      list.push(item);
      if (item.children && item.children.length) {
        walk(item.children);
      }
    });
  };

  walk(goals || []);
  return list;
}
