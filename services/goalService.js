import { DEFAULT_GOAL_FORM } from "../common/goalConstants";
import { cloneDeep, createGoalId } from "../utils/goalUtils";

const STORAGE_KEY = "life-plan-book-goals-v2";
const LEGACY_STORAGE_KEYS = ["life-plan-book-goals-v1"];

function clearLegacyStorage() {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      uni.removeStorageSync(key);
    } catch (error) {
      // ignore legacy cleanup errors
    }
  });
}

function normalizeGoal(goal, parentId = null) {
  const now = new Date().toISOString();
  const goalId = goal.id || createGoalId();
  const status = goal.status || "doing";
  const isUltimate = Boolean(goal.isUltimate);
  const achieveMethod = typeof goal.achieveMethod === "string" ? goal.achieveMethod.trim() : "";
  const currentProgress = typeof goal.currentProgress === "string" ? goal.currentProgress.trim() : "";
  const completionNote = typeof goal.completionNote === "string" ? goal.completionNote.trim() : "";
  const completionImages = Array.isArray(goal.completionImages) ? goal.completionImages.filter(Boolean) : [];
  const completionVideo = typeof goal.completionVideo === "string" ? goal.completionVideo.trim() : "";
  const completedAt = status === "completed"
    ? (typeof goal.completedAt === "string" && goal.completedAt ? goal.completedAt : goal.updatedAt || goal.createdAt || now)
    : "";
  const abandonedAt = status === "abandoned"
    ? (typeof goal.abandonedAt === "string" && goal.abandonedAt ? goal.abandonedAt : goal.updatedAt || goal.createdAt || now)
    : "";
  const stageCompletions = Array.isArray(goal.stageCompletions)
    ? goal.stageCompletions.map((item) => normalizeStageCompletion(item, now))
    : [];
  const normalized = {
    id: goalId,
    title: goal.title || "",
    content: goal.content || "",
    purpose: goal.purpose || "",
    achieveMethod,
    startTime: goal.startTime || "",
    endTime: goal.endTime || "",
    status,
    isUltimate,
    currentProgress: isUltimate ? currentProgress : "",
    completionNote: status === "completed" ? completionNote : "",
    completionImages: status === "completed" ? completionImages : [],
    completionVideo: status === "completed" ? completionVideo : "",
    completedAt,
    abandonedAt,
    stageCompletions,
    parentId,
    children: Array.isArray(goal.children) ? goal.children.map((child) => normalizeGoal(child, goalId)) : [],
    createdAt: goal.createdAt || now,
    updatedAt: now,
  };

  return normalized;
}

function normalizeStageCompletion(record, fallbackTime = new Date().toISOString()) {
  const completedAt = typeof record?.completedAt === "string" && record.completedAt
    ? record.completedAt
    : fallbackTime;

  return {
    id: record?.id || createGoalId(),
    goalId: record?.goalId || record?.id || "",
    title: typeof record?.title === "string" ? record.title : "",
    content: typeof record?.content === "string" ? record.content : "",
    purpose: typeof record?.purpose === "string" ? record.purpose : "",
    achieveMethod: typeof record?.achieveMethod === "string" ? record.achieveMethod : "",
    completionNote: typeof record?.completionNote === "string" ? record.completionNote : "",
    completionImages: Array.isArray(record?.completionImages) ? record.completionImages.filter(Boolean) : [],
    completionVideo: typeof record?.completionVideo === "string" ? record.completionVideo : "",
    parentGoalTitle: typeof record?.parentGoalTitle === "string" ? record.parentGoalTitle : "",
    completedAt,
  };
}

function collectStageCompletions(children, now = new Date().toISOString(), parentGoalTitle = "") {
  return (children || []).reduce((result, child) => {
    const currentParentTitle = parentGoalTitle || "";
    result.push(normalizeStageCompletion({
      id: child.id,
      goalId: child.id,
      title: child.title,
      content: child.content,
      purpose: child.purpose,
      achieveMethod: child.achieveMethod,
      completionNote: child.completionNote,
      completionImages: child.completionImages,
      completionVideo: child.completionVideo,
      parentGoalTitle: currentParentTitle,
      completedAt: child.completedAt || now,
    }, now));

    if (child.children && child.children.length) {
      result.push(...collectStageCompletions(child.children, now, child.title));
    }

    return result;
  }, []);
}

export function createGoalRecord(form = {}, parentId = null) {
  const base = { ...DEFAULT_GOAL_FORM, ...form };
  return normalizeGoal(base, parentId);
}

export function loadGoals() {
  try {
    clearLegacyStorage();
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => normalizeGoal(item, item.parentId || null));
  } catch (error) {
    return [];
  }
}

export function saveGoals(goals) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(cloneDeep(goals)));
}

export function updateGoalById(goals, goalId, patch) {
  let changed = false;
  const now = new Date().toISOString();

  const nextGoals = (goals || []).map((goal) => {
    if (goal.id === goalId) {
      changed = true;
      return {
        ...goal,
        ...patch,
        updatedAt: now,
      };
    }

    if (goal.children && goal.children.length) {
      const childResult = updateGoalById(goal.children, goalId, patch);
      if (childResult.changed) {
        changed = true;
        return {
          ...goal,
          children: childResult.goals,
          updatedAt: now,
        };
      }
    }

    return goal;
  });

  return { goals: nextGoals, changed };
}

export function deleteGoalById(goals, goalId) {
  let deleted = false;

  const nextGoals = (goals || [])
    .filter((goal) => {
      if (goal.id === goalId) {
        deleted = true;
        return false;
      }
      return true;
    })
    .map((goal) => {
      if (!goal.children || !goal.children.length) {
        return goal;
      }
      const childResult = deleteGoalById(goal.children, goalId);
      if (childResult.deleted) {
        deleted = true;
        return {
          ...goal,
          children: childResult.goals,
          updatedAt: new Date().toISOString(),
        };
      }
      return goal;
    });

  return { goals: nextGoals, deleted };
}

export function addChildGoal(goals, parentId, childGoal) {
  let changed = false;
  const now = new Date().toISOString();

  const nextGoals = (goals || []).map((goal) => {
    if (goal.id === parentId) {
      changed = true;
      const children = Array.isArray(goal.children) ? goal.children.slice() : [];
      children.push(normalizeGoal(childGoal, parentId));
      return {
        ...goal,
        children,
        updatedAt: now,
      };
    }

    if (goal.children && goal.children.length) {
      const childResult = addChildGoal(goal.children, parentId, childGoal);
      if (childResult.changed) {
        changed = true;
        return {
          ...goal,
          children: childResult.goals,
          updatedAt: now,
        };
      }
    }

    return goal;
  });

  return { goals: nextGoals, changed };
}

export function completeGoalById(goals, goalId, completion = {}) {
  let changed = false;
  const now = completion.completedAt || new Date().toISOString();

  const nextGoals = (goals || []).map((goal) => {
    if (goal.id === goalId) {
      changed = true;
      const archivedChildren = goal.children && goal.children.length
        ? collectStageCompletions(goal.children, now, goal.title)
        : [];

      return {
        ...goal,
        status: "completed",
        completionNote: typeof completion.completionNote === "string" ? completion.completionNote.trim() : "",
        completionImages: Array.isArray(completion.completionImages) ? completion.completionImages.filter(Boolean) : [],
        completionVideo: typeof completion.completionVideo === "string" ? completion.completionVideo.trim() : "",
        completedAt: now,
        abandonedAt: "",
        stageCompletions: [...(Array.isArray(goal.stageCompletions) ? goal.stageCompletions : []), ...archivedChildren],
        children: [],
        updatedAt: now,
      };
    }

    if (goal.children && goal.children.length) {
      const childResult = completeGoalById(goal.children, goalId, completion);
      if (childResult.changed) {
        changed = true;
        return {
          ...goal,
          children: childResult.goals,
          updatedAt: now,
        };
      }
    }

    return goal;
  });

  return { goals: nextGoals, changed };
}
