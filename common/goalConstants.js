export const GOAL_STATUS_OPTIONS = [
  { value: "doing", label: "进行中", color: "#2563eb" },
  { value: "completed", label: "已完成", color: "#16a34a" },
  { value: "abandoned", label: "已放弃", color: "#dc2626" },
];

export const DEFAULT_GOAL_FORM = {
  title: "",
  content: "",
  purpose: "",
  achieveMethod: "",
  startTime: "",
  endTime: "",
  status: "doing",
  isUltimate: false,
  currentProgress: "",
  completionNote: "",
  completionImages: [],
  completionVideo: "",
  completedAt: "",
  abandonedAt: "",
  stageCompletions: [],
};
