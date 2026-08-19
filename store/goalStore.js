import { computed, reactive } from "vue";
import { addChildGoal, createGoalRecord, deleteGoalById, loadGoals, saveGoals, updateGoalById } from "../services/goalService";
import { flattenGoals, hasGoalCompletionProof } from "../utils/goalUtils";

const state = reactive({
  goals: loadGoals(),
});

function persist() {
  saveGoals(state.goals);
}

function replaceGoals(goals) {
  state.goals = goals;
  persist();
}

export function useGoalStore() {
  const allGoals = computed(() => flattenGoals(state.goals));
  const ultimateGoal = computed(() => allGoals.value.find((goal) => goal.isUltimate) || null);
  const totalCount = computed(() => allGoals.value.length);
  const doingCount = computed(() => allGoals.value.filter((goal) => goal.status === "doing").length);
  const completedCount = computed(() => allGoals.value.filter((goal) => goal.status === "completed").length);
  const abandonedCount = computed(() => allGoals.value.filter((goal) => goal.status === "abandoned").length);

  function hasOtherUltimate(goalId = "") {
    return allGoals.value.some((goal) => goal.isUltimate && goal.id !== goalId);
  }

  function addGoal(form) {
    if (form?.isUltimate && hasOtherUltimate()) {
      return false;
    }

    const next = [createGoalRecord(form), ...state.goals];
    replaceGoals(next);
    return true;
  }

  function editGoal(goalId, patch) {
    const currentGoal = allGoals.value.find((goal) => goal.id === goalId);
    const nextIsUltimate = patch?.isUltimate === undefined ? Boolean(currentGoal?.isUltimate) : Boolean(patch.isUltimate);
    const currentStatus = currentGoal?.status || "doing";
    const nextStatus = patch?.status || currentStatus;
    const now = new Date().toISOString();

    if (nextIsUltimate && hasOtherUltimate(goalId)) {
      return false;
    }

    const progressSource = patch?.currentProgress ?? currentGoal?.currentProgress;
    const normalizedPatch = {
      ...patch,
      status: nextStatus,
      currentProgress: nextIsUltimate && typeof progressSource === "string" ? progressSource.trim() : "",
    };

    if (nextStatus === "completed") {
      normalizedPatch.completedAt = currentStatus === "completed" && currentGoal?.completedAt ? currentGoal.completedAt : (patch?.completedAt || now);
      normalizedPatch.abandonedAt = "";
    } else if (nextStatus === "abandoned") {
      normalizedPatch.completedAt = "";
      normalizedPatch.abandonedAt = currentStatus === "abandoned" && currentGoal?.abandonedAt ? currentGoal.abandonedAt : (patch?.abandonedAt || now);
      normalizedPatch.completionNote = "";
      normalizedPatch.completionImages = [];
      normalizedPatch.completionVideo = "";
    } else {
      normalizedPatch.completedAt = "";
      normalizedPatch.abandonedAt = "";
      normalizedPatch.completionNote = "";
      normalizedPatch.completionImages = [];
      normalizedPatch.completionVideo = "";
    }

    const result = updateGoalById(state.goals, goalId, normalizedPatch);
    if (result.changed) {
      replaceGoals(result.goals);
    }

    return result.changed;
  }

  function removeGoal(goalId) {
    const result = deleteGoalById(state.goals, goalId);
    if (result.deleted) {
      replaceGoals(result.goals);
    }

    return result.deleted;
  }

  function addSubGoal(parentId, form) {
    if (form?.isUltimate) {
      return false;
    }

    const result = addChildGoal(state.goals, parentId, createGoalRecord(form, parentId));
    if (result.changed) {
      replaceGoals(result.goals);
    }

    return result.changed;
  }

  function setGoalStatus(goalId, status, completion = {}) {
    const statusChangedAt = new Date().toISOString();

    if (status === "completed") {
      const completionPatch = {
        completionNote: typeof completion.completionNote === "string" ? completion.completionNote.trim() : "",
        completionImages: Array.isArray(completion.completionImages) ? completion.completionImages.filter(Boolean) : [],
        completionVideo: typeof completion.completionVideo === "string" ? completion.completionVideo.trim() : "",
      };

      if (!hasGoalCompletionProof(completionPatch)) {
        return false;
      }

      return editGoal(goalId, {
        status,
        ...completionPatch,
        completedAt: statusChangedAt,
        abandonedAt: "",
      });
    }

    if (status === "abandoned") {
      return editGoal(goalId, {
        status,
        completionNote: "",
        completionImages: [],
        completionVideo: "",
        completedAt: "",
        abandonedAt: statusChangedAt,
      });
    }

    return editGoal(goalId, {
      status,
      completionNote: "",
      completionImages: [],
      completionVideo: "",
      completedAt: "",
      abandonedAt: "",
    });
  }

  function resetDemoData() {
    replaceGoals([]);
  }

  return {
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
    resetDemoData,
  };
}
