if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$5 = {
    __name: "GoalEmptyState",
    props: {
      title: {
        type: String,
        default: "开始规划你的下一段人生旅程"
      },
      desc: {
        type: String,
        default: "先创建一个主目标，再往下拆分成可执行的子目标，最后逐步完成。"
      },
      buttonText: {
        type: String,
        default: "新建第一个目标"
      }
    },
    emits: ["create"],
    setup(__props, { expose: __expose }) {
      __expose();
      const __returned__ = {};
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "empty" }, [
      vue.createElementVNode("view", { class: "orb orb-a" }),
      vue.createElementVNode("view", { class: "orb orb-b" }),
      vue.createElementVNode("view", { class: "icon" }, "✦"),
      vue.createElementVNode(
        "view",
        { class: "title" },
        vue.toDisplayString($props.title),
        1
        /* TEXT */
      ),
      vue.createElementVNode(
        "view",
        { class: "desc" },
        vue.toDisplayString($props.desc),
        1
        /* TEXT */
      ),
      vue.createElementVNode(
        "view",
        {
          class: "cta",
          onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("create"))
        },
        vue.toDisplayString($props.buttonText),
        1
        /* TEXT */
      )
    ]);
  }
  const GoalEmptyState = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-4187733e"], ["__file", "D:/book3/components/GoalEmptyState.vue"]]);
  const GOAL_STATUS_OPTIONS = [
    { value: "doing", label: "进行中", color: "#2563eb" },
    { value: "completed", label: "已完成", color: "#16a34a" },
    { value: "abandoned", label: "已放弃", color: "#dc2626" }
  ];
  const DEFAULT_GOAL_FORM = {
    title: "",
    content: "",
    purpose: "",
    startTime: "",
    endTime: "",
    status: "doing",
    isUltimate: false,
    currentProgress: "",
    completionNote: "",
    completionImages: [],
    completionVideo: "",
    completedAt: "",
    abandonedAt: ""
  };
  function createGoalId() {
    return `goal_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  }
  function cloneDeep(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function formatDate(value) {
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
    const parts = String(value).split("-").map((item) => Number(item));
    if (parts.length !== 3 || parts.some((item) => Number.isNaN(item))) {
      return null;
    }
    const [year, month, day] = parts;
    return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0).getTime();
  }
  function formatDuration(ms) {
    const minutes = Math.max(1, Math.ceil(ms / (1e3 * 60)));
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }
    const hours = Math.ceil(ms / (1e3 * 60 * 60));
    if (hours < 24) {
      return `${hours} 小时`;
    }
    const days = Math.ceil(ms / (1e3 * 60 * 60 * 24));
    return `${days} 天`;
  }
  function formatDateRange(startTime, endTime) {
    if (!startTime && !endTime) {
      return "时间未设置";
    }
    if (startTime && endTime) {
      return `${formatDate(startTime)} - ${formatDate(endTime)}`;
    }
    return startTime ? `开始：${formatDate(startTime)}` : `结束：${formatDate(endTime)}`;
  }
  function getRemainingMs(endTime, now = Date.now()) {
    const targetTime = parseDateValue(endTime, true);
    if (targetTime === null) {
      return Number.POSITIVE_INFINITY;
    }
    return targetTime - now;
  }
  function formatRemainingTime(endTime, now = Date.now()) {
    const remainingMs = getRemainingMs(endTime, now);
    if (!Number.isFinite(remainingMs)) {
      return "未设置到期时间";
    }
    if (remainingMs < 0) {
      return `已逾期 ${formatDuration(Math.abs(remainingMs))}`;
    }
    return `剩余 ${formatDuration(remainingMs)}`;
  }
  function getGoalUrgencyScore(goal, now = Date.now()) {
    return getRemainingMs(goal == null ? void 0 : goal.endTime, now);
  }
  function sortGoalsByRemainingTime(goals, now = Date.now()) {
    return [...goals || []].sort((first, second) => {
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
      return String((second == null ? void 0 : second.updatedAt) || "").localeCompare(String((first == null ? void 0 : first.updatedAt) || ""));
    });
  }
  function getStatusMeta(status) {
    return GOAL_STATUS_OPTIONS.find((item) => item.value === status) || GOAL_STATUS_OPTIONS[0];
  }
  function hasGoalCompletionProof(goal) {
    const completionNote = typeof (goal == null ? void 0 : goal.completionNote) === "string" ? goal.completionNote.trim() : "";
    const completionImages = Array.isArray(goal == null ? void 0 : goal.completionImages) ? goal.completionImages.filter(Boolean) : [];
    const completionVideo = typeof (goal == null ? void 0 : goal.completionVideo) === "string" ? goal.completionVideo.trim() : "";
    return Boolean(completionNote || completionImages.length || completionVideo);
  }
  function flattenGoals(goals) {
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
  const _sfc_main$4 = /* @__PURE__ */ Object.assign({
    name: "GoalFocusTree"
  }, {
    __name: "GoalFocusTree",
    props: {
      goal: {
        type: Object,
        required: true
      },
      level: {
        type: Number,
        default: 0
      }
    },
    emits: ["select"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const statusMeta = vue.computed(() => getStatusMeta(props.goal.status));
      const statusStyle = vue.computed(() => ({
        color: statusMeta.value.color,
        background: `${statusMeta.value.color}18`
      }));
      function emitSelect(goal) {
        emit("select", goal);
      }
      const __returned__ = { props, emit, statusMeta, statusStyle, emitSelect, computed: vue.computed, get formatDate() {
        return formatDate;
      }, get formatRemainingTime() {
        return formatRemainingTime;
      }, get getStatusMeta() {
        return getStatusMeta;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_GoalFocusTree = vue.resolveComponent("GoalFocusTree", true);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["focus-tree-node", { child: $props.level > 0 }]),
        onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.emitSelect($props.goal), ["stop"]))
      },
      [
        vue.createElementVNode("view", { class: "focus-tree-header" }, [
          vue.createElementVNode("view", { class: "focus-tree-copy" }, [
            vue.createElementVNode("view", { class: "focus-tree-title-row" }, [
              vue.createElementVNode(
                "text",
                { class: "focus-tree-title" },
                vue.toDisplayString($props.goal.title),
                1
                /* TEXT */
              ),
              $props.level === 0 ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                class: "focus-tree-root-tag"
              }, "主目标")) : (vue.openBlock(), vue.createElementBlock("text", {
                key: 1,
                class: "focus-tree-child-tag"
              }, "子目标"))
            ]),
            vue.createElementVNode(
              "view",
              { class: "focus-tree-summary" },
              vue.toDisplayString($props.goal.purpose || $props.goal.content || "点击查看详情、编辑内容与目标进展。"),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode(
            "view",
            {
              class: "focus-tree-status",
              style: vue.normalizeStyle($setup.statusStyle)
            },
            vue.toDisplayString($setup.statusMeta.label),
            5
            /* TEXT, STYLE */
          )
        ]),
        vue.createElementVNode("view", { class: "focus-tree-metrics" }, [
          vue.createElementVNode("view", { class: "focus-tree-metric" }, [
            vue.createElementVNode("text", { class: "metric-label" }, "到期时间"),
            vue.createElementVNode(
              "text",
              { class: "metric-value" },
              vue.toDisplayString($setup.formatDate($props.goal.endTime)),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "focus-tree-metric" }, [
            vue.createElementVNode("text", { class: "metric-label" }, "剩余时间"),
            vue.createElementVNode(
              "text",
              { class: "metric-value emphasis" },
              vue.toDisplayString($setup.formatRemainingTime($props.goal.endTime)),
              1
              /* TEXT */
            )
          ])
        ]),
        $props.goal.children && $props.goal.children.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "focus-tree-children"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($props.goal.children, (child) => {
              return vue.openBlock(), vue.createBlock(_component_GoalFocusTree, {
                key: child.id,
                goal: child,
                level: $props.level + 1,
                onSelect: _cache[0] || (_cache[0] = ($event) => $setup.emit("select", $event))
              }, null, 8, ["goal", "level"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : vue.createCommentVNode("v-if", true)
      ],
      2
      /* CLASS */
    );
  }
  const GoalFocusTree = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-8023c8d9"], ["__file", "D:/book3/components/GoalFocusTree.vue"]]);
  const _sfc_main$3 = {
    __name: "GoalFormDialog",
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      mode: {
        type: String,
        default: "create"
      },
      initialValue: {
        type: Object,
        default: () => ({})
      },
      parentGoalTitle: {
        type: String,
        default: ""
      }
    },
    emits: ["close", "save"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const form = vue.reactive({
        ...DEFAULT_GOAL_FORM
      });
      const statusOptions = GOAL_STATUS_OPTIONS;
      const showUltimateFields = vue.computed(() => props.mode === "ultimate" || Boolean(form.isUltimate));
      const showUltimateSummary = vue.computed(() => props.mode === "ultimate");
      const dialogTitle = vue.computed(() => {
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
      const dialogSubtitle = vue.computed(() => {
        if (props.mode === "complete") {
          return "补充完成凭证后，才能把目标标记为已完成";
        }
        if (props.mode === "ultimate") {
          return "终极目标全局仅允许一个，并可持续记录当前进度";
        }
        if (props.parentGoalTitle) {
          return `当前拆分自：${props.parentGoalTitle}`;
        }
        return "记录你的主目标与子目标";
      });
      const submitText = vue.computed(() => {
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
      const showCompletionFields = vue.computed(() => props.mode === "complete" || form.status === "completed");
      function syncForm() {
        const nextValue = {
          ...DEFAULT_GOAL_FORM,
          ...props.initialValue || {}
        };
        Object.assign(form, nextValue, {
          isUltimate: Boolean(nextValue.isUltimate),
          currentProgress: nextValue.currentProgress || "",
          completionNote: nextValue.completionNote || "",
          completionImages: Array.isArray(nextValue.completionImages) ? nextValue.completionImages.slice() : [],
          completionVideo: nextValue.completionVideo || ""
        });
        if (props.mode === "complete") {
          form.status = "completed";
        }
        if (props.mode === "ultimate") {
          form.isUltimate = true;
        }
      }
      vue.watch(
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
          }
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
          current: form.completionImages[index]
        });
      }
      function chooseCompletionVideo() {
        uni.chooseVideo({
          sourceType: ["album", "camera"],
          compressed: true,
          maxDuration: 120,
          success: (res) => {
            form.completionVideo = res.tempFilePath || "";
          }
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
          completionVideo: form.completionVideo
        };
        if (nextStatus === "completed" && !hasGoalCompletionProof(completionPayload)) {
          uni.showToast({ title: "完成目标时请填写描述、照片或视频", icon: "none" });
          return;
        }
        const normalizedCompletion = nextStatus === "completed" ? completionPayload : {
          completionNote: "",
          completionImages: [],
          completionVideo: ""
        };
        emit("save", {
          title: title || form.title,
          content: form.content.trim(),
          purpose: form.purpose.trim(),
          startTime: form.startTime,
          endTime: form.endTime,
          status: nextStatus,
          isUltimate: props.mode === "ultimate" || Boolean(form.isUltimate),
          currentProgress: showUltimateFields.value ? form.currentProgress.trim() : "",
          ...normalizedCompletion
        });
      }
      const __returned__ = { props, emit, form, statusOptions, showUltimateFields, showUltimateSummary, dialogTitle, dialogSubtitle, submitText, showCompletionFields, syncForm, close, onDateChange, chooseCompletionImages, removeCompletionImage, previewCompletionImage, chooseCompletionVideo, clearCompletionVideo, handleSave, computed: vue.computed, reactive: vue.reactive, watch: vue.watch, get DEFAULT_GOAL_FORM() {
        return DEFAULT_GOAL_FORM;
      }, get GOAL_STATUS_OPTIONS() {
        return GOAL_STATUS_OPTIONS;
      }, get hasGoalCompletionProof() {
        return hasGoalCompletionProof;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.visible ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: "mask",
        onTouchmove: _cache[7] || (_cache[7] = vue.withModifiers(() => {
        }, ["stop", "prevent"]))
      },
      [
        vue.createElementVNode("view", { class: "panel animate-pop" }, [
          vue.createElementVNode("view", { class: "panel-head" }, [
            vue.createElementVNode("view", null, [
              vue.createElementVNode(
                "view",
                { class: "title" },
                vue.toDisplayString($setup.dialogTitle),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "subtitle" },
                vue.toDisplayString($setup.dialogSubtitle),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", {
              class: "close-btn",
              onClick: $setup.close
            }, "×")
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "true",
            class: "panel-body"
          }, [
            $setup.props.mode === "complete" ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "complete-summary"
            }, [
              vue.createElementVNode("view", { class: "complete-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "complete-name" },
                  vue.toDisplayString($setup.form.title || "当前目标"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "complete-text" }, "标记为已完成前，需要补充完成描述、照片或视频，至少填写一项。")
              ])
            ])) : $setup.showUltimateSummary ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "ultimate-summary"
            }, [
              vue.createElementVNode("view", { class: "ultimate-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "ultimate-name" },
                  vue.toDisplayString($setup.form.title || "终极目标"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "ultimate-text" }, "终极目标全局只允许设置一个，后续入口会直接进入编辑模式。")
              ])
            ])) : vue.createCommentVNode("v-if", true),
            $setup.props.mode !== "complete" ? (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 2 },
              [
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("text", { class: "label" }, "目标标题"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.title = $event),
                      class: "input",
                      maxlength: "50",
                      placeholder: "例如：完成年度职业转型"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.title]
                  ])
                ]),
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("text", { class: "label" }, "目标内容"),
                  vue.withDirectives(vue.createElementVNode(
                    "textarea",
                    {
                      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.content = $event),
                      class: "textarea",
                      maxlength: "500",
                      placeholder: "描述这个目标要做什么，越具体越好"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.content]
                  ])
                ]),
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("text", { class: "label" }, "目标目的"),
                  vue.withDirectives(vue.createElementVNode(
                    "textarea",
                    {
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.form.purpose = $event),
                      class: "textarea purpose",
                      maxlength: "500",
                      placeholder: "为什么要做这个目标，它会带来什么改变"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.purpose]
                  ])
                ]),
                $setup.showUltimateFields ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "field"
                }, [
                  vue.createElementVNode("text", { class: "label" }, "当前进度"),
                  vue.withDirectives(vue.createElementVNode(
                    "textarea",
                    {
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.form.currentProgress = $event),
                      class: "textarea progress-textarea",
                      maxlength: "1000",
                      placeholder: "例如：已完成 60%，已完成方案设计，正在推进执行阶段"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.currentProgress]
                  ])
                ])) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode("view", { class: "grid" }, [
                  vue.createElementVNode("view", { class: "field half" }, [
                    vue.createElementVNode("text", { class: "label" }, "开始时间"),
                    vue.createElementVNode("picker", {
                      mode: "date",
                      value: $setup.form.startTime,
                      onChange: _cache[4] || (_cache[4] = ($event) => $setup.onDateChange("startTime", $event))
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "picker" },
                        vue.toDisplayString($setup.form.startTime || "请选择开始时间"),
                        1
                        /* TEXT */
                      )
                    ], 40, ["value"])
                  ]),
                  vue.createElementVNode("view", { class: "field half" }, [
                    vue.createElementVNode("text", { class: "label" }, "结束时间"),
                    vue.createElementVNode("picker", {
                      mode: "date",
                      value: $setup.form.endTime,
                      onChange: _cache[5] || (_cache[5] = ($event) => $setup.onDateChange("endTime", $event))
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "picker" },
                        vue.toDisplayString($setup.form.endTime || "请选择结束时间"),
                        1
                        /* TEXT */
                      )
                    ], 40, ["value"])
                  ])
                ]),
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("text", { class: "label" }, "目标状态"),
                  vue.createElementVNode("view", { class: "status-group" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.statusOptions, (option) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          key: option.value,
                          class: vue.normalizeClass(["status-pill", { active: $setup.form.status === option.value }]),
                          style: vue.normalizeStyle($setup.form.status === option.value ? { borderColor: option.color, color: option.color } : null),
                          onClick: ($event) => $setup.form.status = option.value
                        }, vue.toDisplayString(option.label), 15, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])
              ],
              64
              /* STABLE_FRAGMENT */
            )) : vue.createCommentVNode("v-if", true),
            $setup.showCompletionFields ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              class: "field proof-field"
            }, [
              vue.createElementVNode("view", { class: "proof-head" }, [
                vue.createElementVNode("text", { class: "label" }, "完成凭证"),
                vue.createElementVNode("text", { class: "proof-tip" }, "完成时至少填写描述、照片或视频中的一项")
              ]),
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $setup.form.completionNote = $event),
                  class: "textarea completion-textarea",
                  maxlength: "1000",
                  placeholder: "填写完成描述，例如：过程总结、最终成果、达成结果"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.completionNote]
              ]),
              vue.createElementVNode("view", { class: "proof-actions" }, [
                vue.createElementVNode("view", {
                  class: "proof-btn",
                  onClick: $setup.chooseCompletionImages
                }, "添加照片"),
                vue.createElementVNode("view", {
                  class: "proof-btn",
                  onClick: $setup.chooseCompletionVideo
                }, "添加视频")
              ]),
              $setup.form.completionImages.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "proof-image-grid"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.form.completionImages, (image, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: image + index,
                      class: "proof-image-item"
                    }, [
                      vue.createElementVNode("image", {
                        class: "proof-image",
                        src: image,
                        mode: "aspectFill",
                        onClick: ($event) => $setup.previewCompletionImage(index)
                      }, null, 8, ["src", "onClick"]),
                      vue.createElementVNode("view", {
                        class: "proof-remove",
                        onClick: ($event) => $setup.removeCompletionImage(index)
                      }, "×", 8, ["onClick"])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])) : vue.createCommentVNode("v-if", true),
              $setup.form.completionVideo ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "proof-video-card"
              }, [
                vue.createElementVNode("video", {
                  class: "proof-video",
                  src: $setup.form.completionVideo,
                  controls: "",
                  "object-fit": "cover"
                }, null, 8, ["src"]),
                vue.createElementVNode("view", {
                  class: "proof-remove video-remove",
                  onClick: $setup.clearCompletionVideo
                }, "×")
              ])) : vue.createCommentVNode("v-if", true)
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "panel-footer" }, [
            vue.createElementVNode("view", {
              class: "ghost-btn",
              onClick: $setup.close
            }, "取消"),
            vue.createElementVNode(
              "view",
              {
                class: "primary-btn bounce-btn",
                onClick: $setup.handleSave
              },
              vue.toDisplayString($setup.submitText),
              1
              /* TEXT */
            )
          ])
        ])
      ],
      32
      /* NEED_HYDRATION */
    )) : vue.createCommentVNode("v-if", true);
  }
  const GoalFormDialog = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-613063d3"], ["__file", "D:/book3/components/GoalFormDialog.vue"]]);
  const _sfc_main$2 = /* @__PURE__ */ Object.assign({
    name: "GoalNode"
  }, {
    __name: "GoalNode",
    props: {
      goal: {
        type: Object,
        required: true
      },
      level: {
        type: Number,
        default: 0
      }
    },
    emits: ["edit", "delete", "add-child", "status-change", "select"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const detailsExpanded = vue.ref(true);
      const childrenExpanded = vue.ref(true);
      const statusOptions = GOAL_STATUS_OPTIONS;
      const statusMeta = vue.computed(() => getStatusMeta(props.goal.status));
      const statusColor = vue.computed(() => statusMeta.value.color);
      const statusBg = vue.computed(() => statusMeta.value.color + "18");
      const statusLabel = vue.computed(() => statusMeta.value.label);
      const accentColor = vue.computed(() => {
        if (props.goal.isUltimate) {
          return "#7c3aed";
        }
        if (props.goal.status === "completed") {
          return "#16a34a";
        }
        if (props.goal.status === "abandoned") {
          return "#dc2626";
        }
        return "#2563eb";
      });
      const cardStyle = vue.computed(() => ({ "--accent": accentColor.value }));
      const dateRange = vue.computed(() => formatDateRange(props.goal.startTime, props.goal.endTime));
      const hasCompletionProof = vue.computed(() => hasGoalCompletionProof(props.goal));
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
          current: props.goal.completionImages[index]
        });
      }
      function handleSelect() {
        emit("select", props.goal);
      }
      const __returned__ = { props, emit, detailsExpanded, childrenExpanded, statusOptions, statusMeta, statusColor, statusBg, statusLabel, accentColor, cardStyle, dateRange, hasCompletionProof, toggleDetails, toggleChildren, previewCompletionImages, handleSelect, computed: vue.computed, ref: vue.ref, get GOAL_STATUS_OPTIONS() {
        return GOAL_STATUS_OPTIONS;
      }, get formatDateRange() {
        return formatDateRange;
      }, get getStatusMeta() {
        return getStatusMeta;
      }, get hasGoalCompletionProof() {
        return hasGoalCompletionProof;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_GoalNode = vue.resolveComponent("GoalNode", true);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["goal-node", { child: $props.level > 0 }])
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["card", { ultimate: $props.goal.isUltimate }]),
            style: vue.normalizeStyle($setup.cardStyle)
          },
          [
            vue.createElementVNode("view", {
              class: "card-head clickable-head",
              onClick: vue.withModifiers($setup.handleSelect, ["stop"])
            }, [
              vue.createElementVNode("view", { class: "title-wrap" }, [
                vue.createElementVNode(
                  "view",
                  { class: "goal-title" },
                  vue.toDisplayString($props.goal.title),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "goal-meta" }, [
                  $props.goal.isUltimate ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    class: "meta-pill ultimate-pill"
                  }, "终极目标")) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode(
                    "text",
                    { class: "meta-pill" },
                    vue.toDisplayString($setup.dateRange),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "meta-pill purpose-pill" },
                    vue.toDisplayString($props.goal.purpose || "未填写目标目的"),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "head-tools" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "status-badge",
                    style: vue.normalizeStyle({ background: $setup.statusBg, color: $setup.statusColor })
                  },
                  vue.toDisplayString($setup.statusLabel),
                  5
                  /* TEXT, STYLE */
                )
              ])
            ]),
            vue.createElementVNode("view", {
              class: "collapse-trigger detail-trigger",
              onClick: $setup.toggleDetails
            }, [
              vue.createElementVNode("view", { class: "collapse-copy" }, [
                vue.createElementVNode("text", { class: "collapse-label" }, "目标详情"),
                vue.createElementVNode(
                  "text",
                  { class: "collapse-desc" },
                  vue.toDisplayString($setup.detailsExpanded ? "点击收起内容" : "点击展开内容"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["collapse-indicator", { expanded: $setup.detailsExpanded }])
                },
                [
                  vue.createElementVNode(
                    "text",
                    { class: "collapse-indicator-text" },
                    vue.toDisplayString($setup.detailsExpanded ? "收起" : "展开"),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "collapse-arrow" }, "⌃")
                ],
                2
                /* CLASS */
              )
            ]),
            vue.createVNode(vue.Transition, { name: "collapse-fade" }, {
              default: vue.withCtx(() => [
                $setup.detailsExpanded ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "card-body"
                }, [
                  $props.goal.content ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: "goal-content"
                    },
                    vue.toDisplayString($props.goal.content),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true),
                  $props.goal.isUltimate ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "progress-panel"
                  }, [
                    vue.createElementVNode("view", { class: "progress-head" }, [
                      vue.createElementVNode("text", { class: "progress-title" }, "当前进度"),
                      vue.createElementVNode("text", { class: "progress-badge" }, "持续更新")
                    ]),
                    vue.createElementVNode(
                      "view",
                      { class: "progress-text" },
                      vue.toDisplayString($props.goal.currentProgress || "暂未填写当前进度"),
                      1
                      /* TEXT */
                    )
                  ])) : vue.createCommentVNode("v-if", true),
                  $props.goal.status === "completed" && $setup.hasCompletionProof ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 2,
                    class: "completion-proof"
                  }, [
                    vue.createElementVNode("view", { class: "completion-head" }, [
                      vue.createElementVNode("text", { class: "completion-title" }, "完成记录"),
                      vue.createElementVNode("text", { class: "completion-badge" }, "已提交凭证")
                    ]),
                    $props.goal.completionNote ? (vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: 0,
                        class: "completion-note"
                      },
                      vue.toDisplayString($props.goal.completionNote),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true),
                    $props.goal.completionImages && $props.goal.completionImages.length ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
                      key: 1,
                      class: "completion-images",
                      "scroll-x": "true",
                      "show-scrollbar": "false"
                    }, [
                      vue.createElementVNode("view", { class: "completion-image-row" }, [
                        (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          null,
                          vue.renderList($props.goal.completionImages, (image, index) => {
                            return vue.openBlock(), vue.createElementBlock("image", {
                              key: image + index,
                              class: "completion-image",
                              src: image,
                              mode: "aspectFill",
                              onClick: ($event) => $setup.previewCompletionImages(index)
                            }, null, 8, ["src", "onClick"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        ))
                      ])
                    ])) : vue.createCommentVNode("v-if", true),
                    $props.goal.completionVideo ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 2,
                      class: "completion-video-wrap"
                    }, [
                      vue.createElementVNode("video", {
                        class: "completion-video",
                        src: $props.goal.completionVideo,
                        controls: "",
                        "object-fit": "cover"
                      }, null, 8, ["src"])
                    ])) : vue.createCommentVNode("v-if", true)
                  ])) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode("view", { class: "actions" }, [
                    vue.createElementVNode("view", {
                      class: "action-btn primary",
                      onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("edit", $props.goal))
                    }, "编辑"),
                    vue.createElementVNode("view", {
                      class: "action-btn",
                      onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("add-child", $props.goal))
                    }, "拆分子目标"),
                    vue.createElementVNode("view", {
                      class: "action-btn danger",
                      onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("delete", $props.goal))
                    }, "删除")
                  ]),
                  vue.createElementVNode("view", { class: "quick-status" }, [
                    vue.createElementVNode("view", { class: "quick-label" }, "状态切换"),
                    vue.createElementVNode("view", { class: "status-row" }, [
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList($setup.statusOptions, (option) => {
                          return vue.openBlock(), vue.createElementBlock("view", {
                            key: option.value,
                            class: vue.normalizeClass(["status-option", { active: $props.goal.status === option.value }]),
                            style: vue.normalizeStyle($props.goal.status === option.value ? { borderColor: option.color, color: option.color } : null),
                            onClick: ($event) => _ctx.$emit("status-change", { goal: $props.goal, status: option.value })
                          }, vue.toDisplayString(option.label), 15, ["onClick"]);
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ])
                  ])
                ])) : vue.createCommentVNode("v-if", true)
              ]),
              _: 1
              /* STABLE */
            }),
            $props.goal.children && $props.goal.children.length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "children-block"
            }, [
              vue.createElementVNode("view", {
                class: "collapse-trigger children-head",
                onClick: $setup.toggleChildren
              }, [
                vue.createElementVNode("view", { class: "collapse-copy" }, [
                  vue.createElementVNode("text", { class: "collapse-label" }, "子目标列表"),
                  vue.createElementVNode(
                    "text",
                    { class: "collapse-desc" },
                    "共 " + vue.toDisplayString($props.goal.children.length) + " 项，" + vue.toDisplayString($setup.childrenExpanded ? "点击收起" : "点击展开"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["collapse-indicator", { expanded: $setup.childrenExpanded }])
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      { class: "collapse-indicator-text" },
                      vue.toDisplayString($setup.childrenExpanded ? "收起" : "展开"),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "collapse-arrow" }, "⌃")
                  ],
                  2
                  /* CLASS */
                )
              ]),
              vue.createVNode(vue.Transition, { name: "collapse-fade" }, {
                default: vue.withCtx(() => [
                  $setup.childrenExpanded ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "children-list"
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($props.goal.children, (child) => {
                        return vue.openBlock(), vue.createBlock(_component_GoalNode, {
                          key: child.id,
                          goal: child,
                          level: $props.level + 1,
                          onSelect: _cache[3] || (_cache[3] = ($event) => _ctx.$emit("select", $event)),
                          onEdit: _cache[4] || (_cache[4] = ($event) => _ctx.$emit("edit", $event)),
                          onDelete: _cache[5] || (_cache[5] = ($event) => _ctx.$emit("delete", $event)),
                          onAddChild: _cache[6] || (_cache[6] = ($event) => _ctx.$emit("add-child", $event)),
                          onStatusChange: _cache[7] || (_cache[7] = ($event) => _ctx.$emit("status-change", $event))
                        }, null, 8, ["goal", "level"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])) : vue.createCommentVNode("v-if", true)
                ]),
                _: 1
                /* STABLE */
              })
            ])) : vue.createCommentVNode("v-if", true)
          ],
          6
          /* CLASS, STYLE */
        )
      ],
      2
      /* CLASS */
    );
  }
  const GoalNode = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-9049def3"], ["__file", "D:/book3/components/GoalNode.vue"]]);
  const STORAGE_KEY = "life-plan-book-goals-v2";
  const LEGACY_STORAGE_KEYS = ["life-plan-book-goals-v1"];
  function clearLegacyStorage() {
    LEGACY_STORAGE_KEYS.forEach((key) => {
      try {
        uni.removeStorageSync(key);
      } catch (error) {
      }
    });
  }
  function normalizeGoal(goal, parentId = null) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const goalId = goal.id || createGoalId();
    const status = goal.status || "doing";
    const isUltimate = Boolean(goal.isUltimate);
    const currentProgress = typeof goal.currentProgress === "string" ? goal.currentProgress.trim() : "";
    const completionNote = typeof goal.completionNote === "string" ? goal.completionNote.trim() : "";
    const completionImages = Array.isArray(goal.completionImages) ? goal.completionImages.filter(Boolean) : [];
    const completionVideo = typeof goal.completionVideo === "string" ? goal.completionVideo.trim() : "";
    const completedAt = status === "completed" ? typeof goal.completedAt === "string" && goal.completedAt ? goal.completedAt : goal.updatedAt || goal.createdAt || now : "";
    const abandonedAt = status === "abandoned" ? typeof goal.abandonedAt === "string" && goal.abandonedAt ? goal.abandonedAt : goal.updatedAt || goal.createdAt || now : "";
    const normalized = {
      id: goalId,
      title: goal.title || "",
      content: goal.content || "",
      purpose: goal.purpose || "",
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
      parentId,
      children: Array.isArray(goal.children) ? goal.children.map((child) => normalizeGoal(child, goalId)) : [],
      createdAt: goal.createdAt || now,
      updatedAt: now
    };
    return normalized;
  }
  function createGoalRecord(form = {}, parentId = null) {
    const base = { ...DEFAULT_GOAL_FORM, ...form };
    return normalizeGoal(base, parentId);
  }
  function loadGoals() {
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
  function saveGoals(goals) {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(cloneDeep(goals)));
  }
  function updateGoalById(goals, goalId, patch) {
    let changed = false;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextGoals = (goals || []).map((goal) => {
      if (goal.id === goalId) {
        changed = true;
        return {
          ...goal,
          ...patch,
          updatedAt: now
        };
      }
      if (goal.children && goal.children.length) {
        const childResult = updateGoalById(goal.children, goalId, patch);
        if (childResult.changed) {
          changed = true;
          return {
            ...goal,
            children: childResult.goals,
            updatedAt: now
          };
        }
      }
      return goal;
    });
    return { goals: nextGoals, changed };
  }
  function deleteGoalById(goals, goalId) {
    let deleted = false;
    const nextGoals = (goals || []).filter((goal) => {
      if (goal.id === goalId) {
        deleted = true;
        return false;
      }
      return true;
    }).map((goal) => {
      if (!goal.children || !goal.children.length) {
        return goal;
      }
      const childResult = deleteGoalById(goal.children, goalId);
      if (childResult.deleted) {
        deleted = true;
        return {
          ...goal,
          children: childResult.goals,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return goal;
    });
    return { goals: nextGoals, deleted };
  }
  function addChildGoal(goals, parentId, childGoal) {
    let changed = false;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextGoals = (goals || []).map((goal) => {
      if (goal.id === parentId) {
        changed = true;
        const children = Array.isArray(goal.children) ? goal.children.slice() : [];
        children.push(normalizeGoal(childGoal, parentId));
        return {
          ...goal,
          children,
          updatedAt: now
        };
      }
      if (goal.children && goal.children.length) {
        const childResult = addChildGoal(goal.children, parentId, childGoal);
        if (childResult.changed) {
          changed = true;
          return {
            ...goal,
            children: childResult.goals,
            updatedAt: now
          };
        }
      }
      return goal;
    });
    return { goals: nextGoals, changed };
  }
  const state = vue.reactive({
    goals: loadGoals()
  });
  function persist() {
    saveGoals(state.goals);
  }
  function replaceGoals(goals) {
    state.goals = goals;
    persist();
  }
  function useGoalStore() {
    const allGoals = vue.computed(() => flattenGoals(state.goals));
    const ultimateGoal = vue.computed(() => allGoals.value.find((goal) => goal.isUltimate) || null);
    const totalCount = vue.computed(() => allGoals.value.length);
    const doingCount = vue.computed(() => allGoals.value.filter((goal) => goal.status === "doing").length);
    const completedCount = vue.computed(() => allGoals.value.filter((goal) => goal.status === "completed").length);
    const abandonedCount = vue.computed(() => allGoals.value.filter((goal) => goal.status === "abandoned").length);
    function hasOtherUltimate(goalId = "") {
      return allGoals.value.some((goal) => goal.isUltimate && goal.id !== goalId);
    }
    function addGoal(form) {
      if ((form == null ? void 0 : form.isUltimate) && hasOtherUltimate()) {
        return false;
      }
      const next = [createGoalRecord(form), ...state.goals];
      replaceGoals(next);
      return true;
    }
    function editGoal(goalId, patch) {
      const currentGoal = allGoals.value.find((goal) => goal.id === goalId);
      const nextIsUltimate = (patch == null ? void 0 : patch.isUltimate) === void 0 ? Boolean(currentGoal == null ? void 0 : currentGoal.isUltimate) : Boolean(patch.isUltimate);
      const currentStatus = (currentGoal == null ? void 0 : currentGoal.status) || "doing";
      const nextStatus = (patch == null ? void 0 : patch.status) || currentStatus;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (nextIsUltimate && hasOtherUltimate(goalId)) {
        return false;
      }
      const progressSource = (patch == null ? void 0 : patch.currentProgress) ?? (currentGoal == null ? void 0 : currentGoal.currentProgress);
      const normalizedPatch = {
        ...patch,
        status: nextStatus,
        currentProgress: nextIsUltimate && typeof progressSource === "string" ? progressSource.trim() : ""
      };
      if (nextStatus === "completed") {
        normalizedPatch.completedAt = currentStatus === "completed" && (currentGoal == null ? void 0 : currentGoal.completedAt) ? currentGoal.completedAt : (patch == null ? void 0 : patch.completedAt) || now;
        normalizedPatch.abandonedAt = "";
      } else if (nextStatus === "abandoned") {
        normalizedPatch.completedAt = "";
        normalizedPatch.abandonedAt = currentStatus === "abandoned" && (currentGoal == null ? void 0 : currentGoal.abandonedAt) ? currentGoal.abandonedAt : (patch == null ? void 0 : patch.abandonedAt) || now;
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
      if (form == null ? void 0 : form.isUltimate) {
        return false;
      }
      const result = addChildGoal(state.goals, parentId, createGoalRecord(form, parentId));
      if (result.changed) {
        replaceGoals(result.goals);
      }
      return result.changed;
    }
    function setGoalStatus(goalId, status, completion = {}) {
      const statusChangedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (status === "completed") {
        const completionPatch = {
          completionNote: typeof completion.completionNote === "string" ? completion.completionNote.trim() : "",
          completionImages: Array.isArray(completion.completionImages) ? completion.completionImages.filter(Boolean) : [],
          completionVideo: typeof completion.completionVideo === "string" ? completion.completionVideo.trim() : ""
        };
        if (!hasGoalCompletionProof(completionPatch)) {
          return false;
        }
        return editGoal(goalId, {
          status,
          ...completionPatch,
          completedAt: statusChangedAt,
          abandonedAt: ""
        });
      }
      if (status === "abandoned") {
        return editGoal(goalId, {
          status,
          completionNote: "",
          completionImages: [],
          completionVideo: "",
          completedAt: "",
          abandonedAt: statusChangedAt
        });
      }
      return editGoal(goalId, {
        status,
        completionNote: "",
        completionImages: [],
        completionVideo: "",
        completedAt: "",
        abandonedAt: ""
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
      resetDemoData
    };
  }
  const DAY_MS = 24 * 60 * 60 * 1e3;
  const MIN_CHART_ZOOM = 0.75;
  const MAX_CHART_ZOOM = 2.4;
  const _sfc_main$1 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const WINDOW_WIDTH = uni.getSystemInfoSync ? uni.getSystemInfoSync().windowWidth || 375 : 375;
      const WHEEL_LISTENER_OPTIONS = { passive: false, capture: true };
      const HAS_DOM_QUERY = typeof document !== "undefined" && typeof document.querySelector === "function";
      const HAS_DOM_EVENT_API = typeof document !== "undefined" && typeof document.addEventListener === "function";
      const {
        state: state2,
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
        setGoalStatus
      } = useGoalStore();
      const activeTab = vue.ref("home");
      const detailVisible = vue.ref(false);
      const selectedGoalId = vue.ref("");
      const chartPanelRef = vue.ref(null);
      const timelineScrollRef = vue.ref(null);
      const chartZoom = vue.ref(1);
      const activeProofGoalId = vue.ref("");
      const pinchState = vue.reactive({
        active: false,
        startDistance: 0,
        startZoom: 1
      });
      const dialog = vue.reactive({
        visible: false,
        mode: "create",
        initialValue: {},
        parentGoalId: "",
        parentGoalTitle: ""
      });
      const groupExpanded = vue.reactive({
        doing: true,
        completed: false,
        abandoned: false
      });
      const regularGoals = vue.computed(() => state2.goals.filter((goal) => !goal.isUltimate));
      const regularFlatGoals = vue.computed(() => allGoals.value.filter((goal) => !goal.isUltimate));
      const ultimateRootGoal = vue.computed(() => state2.goals.find((goal) => goal.isUltimate) || ultimateGoal.value || null);
      const ultimateButtonText = vue.computed(() => ultimateRootGoal.value ? "编辑终极目标" : "设置终极目标");
      const ultimateStatusMeta = vue.computed(() => {
        var _a;
        return getStatusMeta(((_a = ultimateRootGoal.value) == null ? void 0 : _a.status) || "doing");
      });
      const ultimateStatusStyle = vue.computed(() => ({
        color: ultimateStatusMeta.value.color,
        background: `${ultimateStatusMeta.value.color}1A`
      }));
      const focusGoalTrees = vue.computed(() => sortGoalTree(filterGoalTree(regularGoals.value, "doing")));
      const chartDisplayMode = vue.computed(() => {
        if (chartZoom.value >= 1.45) {
          return "detail";
        }
        if (chartZoom.value <= 0.95) {
          return "compact";
        }
        return "normal";
      });
      const chartDensityLabel = vue.computed(() => {
        if (chartDisplayMode.value === "detail") {
          return "细节视图";
        }
        if (chartDisplayMode.value === "compact") {
          return "概览视图";
        }
        return "标准视图";
      });
      const chartSummary = vue.computed(() => {
        var _a, _b;
        const total = regularFlatGoals.value.length;
        const completed = regularFlatGoals.value.filter((goal) => goal.status === "completed").length;
        const percent = total ? Math.round(completed / total * 100) : 0;
        return {
          total,
          completed,
          percent,
          progressWidth: `${Math.max(total ? percent : 6, 6)}%`,
          progressText: total ? `整体完成度 ${percent}%` : "整体完成度 0%",
          ultimateTitle: ((_a = ultimateRootGoal.value) == null ? void 0 : _a.title) || "暂未设置终极目标",
          ultimateProgress: ((_b = ultimateRootGoal.value) == null ? void 0 : _b.currentProgress) || "尚未记录终极目标当前进度。"
        };
      });
      const chartTimeline = vue.computed(() => buildChartTimeline(regularFlatGoals.value, chartZoom.value, chartDisplayMode.value));
      const groupedGoals = vue.computed(() => {
        return [
          {
            key: "doing",
            label: "进行中",
            desc: "优先关注即将到期的目标，可继续编辑、拆分和变更状态。",
            count: allGoals.value.filter((goal) => goal.status === "doing" && !goal.isUltimate).length,
            goals: sortGoalTree(filterGoalTree(regularGoals.value, "doing"))
          },
          {
            key: "completed",
            label: "已完成",
            desc: "查看已经完成的目标记录、凭证内容与对应子目标。",
            count: allGoals.value.filter((goal) => goal.status === "completed" && !goal.isUltimate).length,
            goals: sortGoalTree(filterGoalTree(regularGoals.value, "completed"))
          },
          {
            key: "abandoned",
            label: "已放弃",
            desc: "集中查看已放弃目标，便于后续恢复、删除或复盘。",
            count: allGoals.value.filter((goal) => goal.status === "abandoned" && !goal.isUltimate).length,
            goals: sortGoalTree(filterGoalTree(regularGoals.value, "abandoned"))
          }
        ];
      });
      const selectedGoal = vue.computed(() => {
        if (!selectedGoalId.value) {
          return null;
        }
        const found = findGoalTreeById(state2.goals, selectedGoalId.value);
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
                children
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
          children: goal.children && goal.children.length ? sortGoalTree(goal.children) : []
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
      function updateChartZoom(nextZoom) {
        chartZoom.value = Number(clamp(nextZoom, MIN_CHART_ZOOM, MAX_CHART_ZOOM).toFixed(2));
      }
      function parseYmdToMs(value, endOfDay = false) {
        if (!value) {
          return null;
        }
        const parts = String(value).split("-").map((item) => Number(item));
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
      function formatAxisLabel(ms) {
        const date = new Date(ms);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}.${day}`;
      }
      function formatMsToDate(ms) {
        const date = new Date(ms);
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
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
        if (mode === "detail") {
          return 170;
        }
        if (mode === "compact") {
          return 102;
        }
        return 132;
      }
      function getColumnWidth(zoom, mode) {
        const base = mode === "detail" ? 108 : mode === "compact" ? 68 : 84;
        return Math.round(base * zoom);
      }
      function getStatusPriority(status) {
        if (status === "doing") {
          return 0;
        }
        if (status === "completed") {
          return 1;
        }
        return 2;
      }
      function buildTicks(startMs, endMs, mode) {
        const totalDays = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
        const step = mode === "detail" ? Math.max(1, Math.ceil(totalDays / 8)) : mode === "compact" ? Math.max(6, Math.ceil(totalDays / 4)) : Math.max(3, Math.ceil(totalDays / 6));
        const ticks = [];
        for (let index = 0; index <= totalDays; index += step) {
          const currentMs = startMs + index * DAY_MS;
          const left = `${(currentMs - startMs) / (endMs - startMs) * 100}%`;
          ticks.push({
            key: `${currentMs}_${index}`,
            label: formatAxisLabel(currentMs),
            left
          });
        }
        const finalLeft = "100%";
        const finalLabel = formatAxisLabel(endMs);
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
        const eventMs = goal.status === "doing" ? Math.max(startMs, nowMs) : goal.status === "completed" ? completedAtMs || updatedMs || deadlineMs || startMs : abandonedAtMs || updatedMs || deadlineMs || startMs;
        const visibleEndMs = goal.status === "doing" ? Math.max(startMs + DAY_MS * 0.8, eventMs) : Math.max(startMs + DAY_MS * 0.8, eventMs);
        const eventDateText = formatDate(formatMsToDate(eventMs));
        const eventActionText = goal.status === "completed" ? "完成" : "放弃";
        return {
          ...goal,
          color: statusMeta.color,
          startMs,
          eventMs,
          deadlineMs,
          endMs: visibleEndMs,
          eventLabel: goal.status === "doing" ? "进行中" : goal.status === "completed" ? "已完成" : "已放弃",
          timeText: goal.status === "doing" ? `${formatDate(goal.startTime || "")} 开始 · 当前正在推进` : `${formatDate(goal.startTime || "")} 开始 · ${eventDateText} ${eventActionText}`,
          deadlineText: goal.endTime ? formatDate(goal.endTime) : "",
          extraText: goal.purpose || goal.content || "",
          hasProof: Boolean(goal.completionNote || goal.completionImages && goal.completionImages.length || goal.completionVideo),
          badgeStyle: {
            color: statusMeta.color,
            background: `${statusMeta.color}1A`
          }
        };
      }
      function layoutTimelineItems(items, rangeStart, rangeEnd, mode) {
        const cardHeight = getCardHeight(mode);
        const rowGap = mode === "detail" ? 28 : 20;
        const verticalPadding = 24;
        const rowEndTimes = [];
        const totalSpan = Math.max(DAY_MS, rangeEnd - rangeStart);
        const arranged = items.slice().sort((first, second) => {
          if (first.startMs !== second.startMs) {
            return first.startMs - second.startMs;
          }
          const priorityDiff = getStatusPriority(first.status) - getStatusPriority(second.status);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          return first.endMs - second.endMs;
        }).map((item) => {
          let rowIndex = getStatusPriority(item.status);
          while (rowEndTimes[rowIndex] !== void 0 && item.startMs <= rowEndTimes[rowIndex] + DAY_MS * 0.35) {
            rowIndex += 3;
          }
          rowEndTimes[rowIndex] = Math.max(item.endMs, item.deadlineMs || item.endMs);
          const leftPercent = (item.startMs - rangeStart) / totalSpan * 100;
          const widthPercent = Math.max((item.endMs - item.startMs) / totalSpan * 100, mode === "compact" ? 12 : 16);
          const top = verticalPadding + rowIndex * (cardHeight + rowGap);
          return {
            ...item,
            style: {
              left: `${clamp(leftPercent, 0, 96)}%`,
              width: `${clamp(widthPercent, mode === "compact" ? 12 : 16, 92)}%`,
              top: `${top}rpx`,
              height: `${cardHeight}rpx`,
              borderColor: `${item.color}55`,
              background: `linear-gradient(135deg, ${item.color}14, rgba(255,255,255,0.98))`,
              boxShadow: activeProofGoalId.value === item.id ? `0 24rpx 56rpx ${item.color}2A` : "0 16rpx 36rpx rgba(15, 23, 42, 0.08)"
            }
          };
        });
        const rowCount = rowEndTimes.length || 1;
        const laneHeight = verticalPadding * 2 + rowCount * cardHeight + (rowCount - 1) * rowGap;
        return {
          items: arranged,
          height: `${laneHeight}rpx`,
          count: items.length
        };
      }
      function buildChartTimeline(goals, zoom, mode) {
        const nowMs = Date.now();
        const items = goals.map((goal) => buildTimelineItem(goal, nowMs));
        const relatedMs = items.flatMap((item) => [item.startMs, item.endMs, item.deadlineMs].filter(Boolean));
        const baseStart = relatedMs.length ? Math.min(...relatedMs) : nowMs - DAY_MS * 7;
        const baseEnd = relatedMs.length ? Math.max(...relatedMs) : nowMs + DAY_MS * 7;
        const paddingDays = mode === "detail" ? 3 : 4;
        const rangeStart = baseStart - paddingDays * DAY_MS;
        const rangeEnd = baseEnd + paddingDays * DAY_MS;
        const totalDays = Math.max(10, Math.ceil((rangeEnd - rangeStart) / DAY_MS) + 1);
        const contentWidthValue = Math.max(1600, totalDays * getColumnWidth(zoom, mode));
        const stageResult = layoutTimelineItems(items, rangeStart, rangeEnd, mode);
        const todayVisible = nowMs >= rangeStart && nowMs <= rangeEnd;
        const todayLeft = `${(nowMs - rangeStart) / Math.max(DAY_MS, rangeEnd - rangeStart) * 100}%`;
        return {
          hasGoals: items.length > 0,
          contentWidth: `${contentWidthValue}rpx`,
          contentWidthValue,
          rangeStart,
          rangeEnd,
          ticks: buildTicks(rangeStart, rangeEnd, mode),
          todayVisible,
          todayLeft,
          rangeLabel: `${formatDate(formatMsToDate(rangeStart))} - ${formatDate(formatMsToDate(rangeEnd))}`,
          items: stageResult.items,
          height: stageResult.height,
          count: stageResult.count
        };
      }
      function switchTab(tab) {
        activeTab.value = tab;
        activeProofGoalId.value = "";
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
        if (goal.status === "completed" && goal.hasProof) {
          activeProofGoalId.value = activeProofGoalId.value === goal.id ? "" : goal.id;
          return;
        }
        activeProofGoalId.value = "";
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
        if (activeTab.value !== "chart") {
          return;
        }
        const rawDelta = Number((event == null ? void 0 : event.deltaY) || (event == null ? void 0 : event.wheelDeltaY) || (event == null ? void 0 : event.wheelDelta) || 0);
        if (!rawDelta) {
          return;
        }
        if (typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        if (typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
        const step = Math.min(0.32, Math.max(0.08, Math.abs(rawDelta) / 600));
        const direction = rawDelta < 0 ? 1 : -1;
        updateChartZoom(chartZoom.value + direction * step);
      }
      function handleGlobalWheel(event) {
        if (activeTab.value !== "chart" || !isWheelInsideChart(event)) {
          return;
        }
        handleChartWheel(event);
      }
      function resolveNativeElement(target) {
        var _a, _b;
        if (!target) {
          return null;
        }
        if (typeof target.addEventListener === "function") {
          return target;
        }
        if (target.$el && typeof target.$el.addEventListener === "function") {
          return target.$el;
        }
        if (((_b = (_a = target.$) == null ? void 0 : _a.vnode) == null ? void 0 : _b.el) && typeof target.$.vnode.el.addEventListener === "function") {
          return target.$.vnode.el;
        }
        return null;
      }
      function queryChartDomElements() {
        if (!HAS_DOM_QUERY) {
          return [];
        }
        return [document.querySelector(".chart-panel"), document.querySelector(".timeline-scroll")].filter(Boolean);
      }
      function getChartWheelTargets() {
        const targets = [...queryChartDomElements(), resolveNativeElement(chartPanelRef.value), resolveNativeElement(timelineScrollRef.value)].filter(Boolean);
        return targets.filter((element, index) => targets.indexOf(element) === index);
      }
      function isWheelInsideChart(event) {
        const targets = getChartWheelTargets();
        if (!targets.length) {
          return activeTab.value === "chart";
        }
        const eventPath = typeof (event == null ? void 0 : event.composedPath) === "function" ? event.composedPath() : [];
        const eventTarget = (event == null ? void 0 : event.target) || null;
        if (eventPath.length) {
          return targets.some((element) => eventPath.includes(element));
        }
        if (eventTarget) {
          return targets.some((element) => typeof element.contains === "function" && element.contains(eventTarget));
        }
        const pointX = Number(event == null ? void 0 : event.clientX);
        const pointY = Number(event == null ? void 0 : event.clientY);
        if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
          return false;
        }
        return targets.some((element) => {
          if (!element || typeof element.getBoundingClientRect !== "function") {
            return false;
          }
          const rect = element.getBoundingClientRect();
          return pointX >= rect.left && pointX <= rect.right && pointY >= rect.top && pointY <= rect.bottom;
        });
      }
      function bindWheelZoom() {
        const elements = getChartWheelTargets();
        elements.forEach((element) => {
          element.addEventListener("wheel", handleChartWheel, WHEEL_LISTENER_OPTIONS);
          element.addEventListener("mousewheel", handleChartWheel, WHEEL_LISTENER_OPTIONS);
        });
      }
      function unbindWheelZoom() {
        const elements = getChartWheelTargets();
        elements.forEach((element) => {
          element.removeEventListener("wheel", handleChartWheel, WHEEL_LISTENER_OPTIONS);
          element.removeEventListener("mousewheel", handleChartWheel, WHEEL_LISTENER_OPTIONS);
        });
      }
      vue.watch(
        () => activeTab.value,
        async (tab) => {
          unbindWheelZoom();
          if (tab !== "chart") {
            return;
          }
          await vue.nextTick();
          bindWheelZoom();
        },
        { immediate: true }
      );
      vue.watch(
        () => chartTimeline.value.contentWidthValue,
        async () => {
          if (activeTab.value !== "chart") {
            return;
          }
          await vue.nextTick();
          unbindWheelZoom();
          bindWheelZoom();
        }
      );
      vue.onMounted(() => {
        if (HAS_DOM_EVENT_API) {
          document.addEventListener("wheel", handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
          document.addEventListener("mousewheel", handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
        }
        if (activeTab.value === "chart") {
          bindWheelZoom();
        }
      });
      vue.onBeforeUnmount(() => {
        unbindWheelZoom();
        if (HAS_DOM_EVENT_API) {
          document.removeEventListener("wheel", handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
          document.removeEventListener("mousewheel", handleGlobalWheel, WHEEL_LISTENER_OPTIONS);
        }
      });
      function openCreateRoot() {
        dialog.visible = true;
        dialog.mode = "create";
        dialog.initialValue = {
          isUltimate: false
        };
        dialog.parentGoalId = "";
        dialog.parentGoalTitle = "";
      }
      function openEdit(goal) {
        closeDetail();
        dialog.visible = true;
        dialog.mode = goal.isUltimate ? "ultimate" : "edit";
        dialog.initialValue = { ...goal };
        dialog.parentGoalId = "";
        dialog.parentGoalTitle = "";
      }
      function openUltimateGoal() {
        closeDetail();
        dialog.visible = true;
        dialog.mode = "ultimate";
        dialog.initialValue = ultimateRootGoal.value ? { ...ultimateRootGoal.value } : {
          isUltimate: true,
          status: "doing"
        };
        dialog.parentGoalId = "";
        dialog.parentGoalTitle = "";
      }
      function openCreateChild(goal) {
        closeDetail();
        dialog.visible = true;
        dialog.mode = "child";
        dialog.initialValue = {
          isUltimate: false
        };
        dialog.parentGoalId = goal.id;
        dialog.parentGoalTitle = goal.title;
      }
      function openCompleteGoal(goal) {
        closeDetail();
        dialog.visible = true;
        dialog.mode = "complete";
        dialog.initialValue = {
          ...goal,
          status: "completed"
        };
        dialog.parentGoalId = "";
        dialog.parentGoalTitle = "";
      }
      function closeDialog() {
        dialog.visible = false;
      }
      function saveGoal(form) {
        let success = false;
        if ((dialog.mode === "edit" || dialog.mode === "complete" || dialog.mode === "ultimate") && dialog.initialValue && dialog.initialValue.id) {
          success = editGoal(dialog.initialValue.id, form);
        } else if (dialog.mode === "child" && dialog.parentGoalId) {
          success = addSubGoal(dialog.parentGoalId, form);
        } else {
          success = addGoal(form);
        }
        if (!success) {
          uni.showToast({ title: "终极目标只允许设置一个，请直接编辑已有终极目标", icon: "none" });
          return;
        }
        closeDialog();
      }
      function confirmDelete(goal) {
        uni.showModal({
          title: "删除目标",
          content: "确认删除「" + goal.title + "」吗？删除后其子目标也会一起移除。",
          confirmColor: "#dc2626",
          success: (res) => {
            if (res.confirm) {
              removeGoal(goal.id);
              if (selectedGoalId.value === goal.id) {
                closeDetail();
              }
            }
          }
        });
      }
      function changeStatus(payload) {
        if (!payload || !payload.goal) {
          return;
        }
        if (payload.status === "completed") {
          openCompleteGoal(payload.goal);
          return;
        }
        setGoalStatus(payload.goal.id, payload.status);
      }
      const __returned__ = { DAY_MS, MIN_CHART_ZOOM, MAX_CHART_ZOOM, WINDOW_WIDTH, WHEEL_LISTENER_OPTIONS, HAS_DOM_QUERY, HAS_DOM_EVENT_API, state: state2, allGoals, ultimateGoal, totalCount, doingCount, completedCount, abandonedCount, addGoal, editGoal, removeGoal, addSubGoal, setGoalStatus, activeTab, detailVisible, selectedGoalId, chartPanelRef, timelineScrollRef, chartZoom, activeProofGoalId, pinchState, dialog, groupExpanded, regularGoals, regularFlatGoals, ultimateRootGoal, ultimateButtonText, ultimateStatusMeta, ultimateStatusStyle, focusGoalTrees, chartDisplayMode, chartDensityLabel, chartSummary, chartTimeline, groupedGoals, selectedGoal, filterGoalTree, sortGoalTree, findGoalTreeById, clamp, updateChartZoom, parseYmdToMs, parseIsoToMs, formatAxisLabel, formatMsToDate, getDistance, getCardHeight, getColumnWidth, getStatusPriority, buildTicks, buildTimelineItem, layoutTimelineItems, buildChartTimeline, switchTab, toggleGroup, openDetail, closeDetail, handleTimelineGoalTap, handleChartTouchStart, handleChartTouchMove, handleChartTouchEnd, handleChartWheel, handleGlobalWheel, resolveNativeElement, queryChartDomElements, getChartWheelTargets, isWheelInsideChart, bindWheelZoom, unbindWheelZoom, openCreateRoot, openEdit, openUltimateGoal, openCreateChild, openCompleteGoal, closeDialog, saveGoal, confirmDelete, changeStatus, computed: vue.computed, nextTick: vue.nextTick, onBeforeUnmount: vue.onBeforeUnmount, onMounted: vue.onMounted, reactive: vue.reactive, ref: vue.ref, watch: vue.watch, GoalEmptyState, GoalFocusTree, GoalFormDialog, GoalNode, get useGoalStore() {
        return useGoalStore;
      }, get formatDate() {
        return formatDate;
      }, get formatRemainingTime() {
        return formatRemainingTime;
      }, get getStatusMeta() {
        return getStatusMeta;
      }, get sortGoalsByRemainingTime() {
        return sortGoalsByRemainingTime;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "page-shell" }, [
        $setup.activeTab === "home" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "tab-panel home-panel"
        }, [
          vue.createElementVNode("view", { class: "floating-board ultimate-board" }, [
            vue.createElementVNode("view", { class: "board-label-row" }, [
              vue.createElementVNode("text", { class: "board-label" }, "终极目标"),
              vue.createElementVNode(
                "text",
                {
                  class: "board-action",
                  onClick: $setup.openUltimateGoal
                },
                vue.toDisplayString($setup.ultimateButtonText),
                1
                /* TEXT */
              )
            ]),
            $setup.ultimateRootGoal ? (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              [
                vue.createElementVNode("view", {
                  class: "ultimate-title-row",
                  onClick: _cache[0] || (_cache[0] = ($event) => $setup.openDetail($setup.ultimateRootGoal))
                }, [
                  vue.createElementVNode("view", null, [
                    vue.createElementVNode(
                      "view",
                      { class: "ultimate-title" },
                      vue.toDisplayString($setup.ultimateRootGoal.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "ultimate-date" },
                      "到期日期：" + vue.toDisplayString($setup.formatDate($setup.ultimateRootGoal.endTime)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    {
                      class: "ultimate-status-badge",
                      style: vue.normalizeStyle($setup.ultimateStatusStyle)
                    },
                    vue.toDisplayString($setup.ultimateStatusMeta.label),
                    5
                    /* TEXT, STYLE */
                  )
                ]),
                vue.createElementVNode("view", { class: "ultimate-progress-wrap" }, [
                  vue.createElementVNode("view", { class: "ultimate-progress-label" }, "当前进度"),
                  vue.createElementVNode(
                    "view",
                    { class: "ultimate-progress-text" },
                    vue.toDisplayString($setup.ultimateRootGoal.currentProgress || "暂未记录，点击右上角可立即补充进度。"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "ultimate-meta-grid" }, [
                  vue.createElementVNode("view", { class: "meta-box" }, [
                    vue.createElementVNode("text", { class: "meta-box-label" }, "剩余时间"),
                    vue.createElementVNode(
                      "text",
                      { class: "meta-box-value emphasis" },
                      vue.toDisplayString($setup.formatRemainingTime($setup.ultimateRootGoal.endTime)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "meta-box" }, [
                    vue.createElementVNode("text", { class: "meta-box-label" }, "目标状态"),
                    vue.createElementVNode(
                      "text",
                      { class: "meta-box-value" },
                      vue.toDisplayString($setup.ultimateStatusMeta.label),
                      1
                      /* TEXT */
                    )
                  ])
                ])
              ],
              64
              /* STABLE_FRAGMENT */
            )) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "panel-empty"
            }, [
              vue.createElementVNode("view", { class: "panel-empty-title" }, "还没有终极目标"),
              vue.createElementVNode("view", { class: "panel-empty-desc" }, "首页顶部会持续浮动展示唯一终极目标的进度、到期日期与剩余时间。"),
              vue.createElementVNode("view", {
                class: "panel-empty-btn",
                onClick: $setup.openUltimateGoal
              }, "立即设置")
            ]))
          ]),
          vue.createElementVNode("view", { class: "floating-board carousel-board" }, [
            vue.createElementVNode("view", { class: "board-label-row" }, [
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", { class: "carousel-title" }, "当前进行中的目标"),
                vue.createElementVNode("view", { class: "carousel-subtitle" }, "按剩余时间从近到远排序，每张卡片直接展示主目标及其子目标")
              ]),
              vue.createElementVNode(
                "text",
                { class: "carousel-count" },
                vue.toDisplayString($setup.focusGoalTrees.length) + " 项",
                1
                /* TEXT */
              )
            ]),
            $setup.focusGoalTrees.length ? (vue.openBlock(), vue.createElementBlock("swiper", {
              key: 0,
              class: "goal-swiper",
              circular: "",
              autoplay: "",
              "indicator-dots": "",
              interval: 3200,
              duration: 450
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.focusGoalTrees, (goal) => {
                  return vue.openBlock(), vue.createElementBlock("swiper-item", {
                    key: goal.id
                  }, [
                    vue.createElementVNode("scroll-view", {
                      "scroll-y": "true",
                      class: "focus-card-scroll"
                    }, [
                      vue.createElementVNode("view", { class: "focus-card" }, [
                        vue.createVNode($setup["GoalFocusTree"], {
                          goal,
                          onSelect: $setup.openDetail
                        }, null, 8, ["goal"])
                      ])
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : (vue.openBlock(), vue.createBlock($setup["GoalEmptyState"], {
              key: 1,
              title: "暂无进行中的目标",
              desc: "点击目标列表页顶部的新增目标，开始添加主目标或继续拆分子目标。",
              "button-text": "新增目标",
              onCreate: $setup.openCreateRoot
            }))
          ])
        ])) : $setup.activeTab === "list" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "tab-panel list-panel"
        }, [
          vue.createElementVNode("view", { class: "overview-board" }, [
            vue.createElementVNode("view", { class: "overview-head" }, [
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", { class: "overview-title" }, "目标列表"),
                vue.createElementVNode("view", { class: "overview-subtitle" }, "查看、编辑并分组管理全部目标与子目标")
              ]),
              vue.createElementVNode("view", {
                class: "overview-action",
                onClick: $setup.openCreateRoot
              }, [
                vue.createElementVNode("text", { class: "overview-action-icon" }, "＋"),
                vue.createElementVNode("text", null, "新增目标")
              ])
            ]),
            vue.createElementVNode("view", { class: "stats-grid" }, [
              vue.createElementVNode("view", { class: "stat-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.totalCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "stat-label" }, "总目标")
              ]),
              vue.createElementVNode("view", { class: "stat-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.doingCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "stat-label" }, "进行中")
              ]),
              vue.createElementVNode("view", { class: "stat-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.completedCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "stat-label" }, "已完成")
              ]),
              vue.createElementVNode("view", { class: "stat-card" }, [
                vue.createElementVNode(
                  "view",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.abandonedCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "stat-label" }, "已放弃")
              ])
            ])
          ]),
          $setup.ultimateRootGoal ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "mini-ultimate-card",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.openDetail($setup.ultimateRootGoal))
          }, [
            vue.createElementVNode("view", null, [
              vue.createElementVNode("view", { class: "mini-ultimate-label" }, "终极目标浮动卡片"),
              vue.createElementVNode(
                "view",
                { class: "mini-ultimate-title" },
                vue.toDisplayString($setup.ultimateRootGoal.title),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode(
              "view",
              { class: "mini-ultimate-meta" },
              vue.toDisplayString($setup.formatRemainingTime($setup.ultimateRootGoal.endTime)),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.groupedGoals, (group) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: group.key,
                class: "group-board"
              }, [
                vue.createElementVNode("view", {
                  class: "group-head",
                  onClick: ($event) => $setup.toggleGroup(group.key)
                }, [
                  vue.createElementVNode("view", { class: "group-copy" }, [
                    vue.createElementVNode("view", { class: "group-title-row" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "group-title" },
                        vue.toDisplayString(group.label),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "group-count" },
                        vue.toDisplayString(group.count) + " 项",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "group-desc" },
                      vue.toDisplayString(group.desc),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["group-toggle", { expanded: $setup.groupExpanded[group.key] }])
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "group-toggle-text" },
                        vue.toDisplayString($setup.groupExpanded[group.key] ? "收起" : "展开"),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("text", { class: "group-toggle-arrow" }, "⌃")
                    ],
                    2
                    /* CLASS */
                  )
                ], 8, ["onClick"]),
                vue.createVNode(
                  vue.Transition,
                  { name: "board-collapse" },
                  {
                    default: vue.withCtx(() => [
                      $setup.groupExpanded[group.key] ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "group-body"
                      }, [
                        !group.goals.length ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          class: "group-empty"
                        }, [
                          vue.createElementVNode(
                            "view",
                            { class: "group-empty-title" },
                            "当前没有" + vue.toDisplayString(group.label),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode("view", { class: "group-empty-desc" }, "该分组为空时，你依然可以继续新增目标或从其他分组调整状态。")
                        ])) : vue.createCommentVNode("v-if", true),
                        (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          null,
                          vue.renderList(group.goals, (goal) => {
                            return vue.openBlock(), vue.createBlock($setup["GoalNode"], {
                              key: goal.id,
                              goal,
                              level: 0,
                              onSelect: $setup.openDetail,
                              onEdit: $setup.openEdit,
                              onDelete: $setup.confirmDelete,
                              onAddChild: $setup.openCreateChild,
                              onStatusChange: $setup.changeStatus
                            }, null, 8, ["goal"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        ))
                      ])) : vue.createCommentVNode("v-if", true)
                    ]),
                    _: 2
                    /* DYNAMIC */
                  },
                  1024
                  /* DYNAMIC_SLOTS */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 2,
            ref: "chartPanelRef",
            class: "tab-panel chart-panel",
            onWheelCapture: vue.withModifiers($setup.handleChartWheel, ["stop", "prevent"]),
            onMousewheelCapture: vue.withModifiers($setup.handleChartWheel, ["stop", "prevent"]),
            onTouchstart: $setup.handleChartTouchStart,
            onTouchmove: $setup.handleChartTouchMove,
            onTouchend: $setup.handleChartTouchEnd,
            onTouchcancel: $setup.handleChartTouchEnd
          },
          [
            vue.createElementVNode("view", { class: "chart-board" }, [
              vue.createElementVNode("view", { class: "chart-hero" }, [
                vue.createElementVNode("view", { class: "chart-hero-side" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "chart-zoom-chip" },
                    "缩放 " + vue.toDisplayString(Math.round($setup.chartZoom * 100)) + "%",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "chart-zoom-tip" }, "双指可在任意区域放大缩小，自动切换信息密度")
                ]),
                vue.createElementVNode("view", { class: "chart-hero-center" }, [
                  vue.createElementVNode("view", { class: "chart-hero-label" }, "终极目标 / 全局进度"),
                  vue.createElementVNode(
                    "view",
                    { class: "chart-hero-title" },
                    vue.toDisplayString($setup.chartSummary.ultimateTitle),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "chart-hero-progress" },
                    vue.toDisplayString($setup.chartSummary.ultimateProgress),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "chart-progress-track" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "chart-progress-fill",
                        style: vue.normalizeStyle({ width: $setup.chartSummary.progressWidth })
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "chart-progress-meta" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.chartSummary.progressText),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.chartSummary.completed) + " / " + vue.toDisplayString($setup.chartSummary.total || 0) + " 已完成",
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "chart-hero-side chart-hero-side-right" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "chart-density-chip" },
                    vue.toDisplayString($setup.chartDensityLabel),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "chart-range-tip" },
                    vue.toDisplayString($setup.chartTimeline.rangeLabel),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              !$setup.chartTimeline.hasGoals ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "chart-empty-state"
              }, [
                vue.createElementVNode("view", { class: "chart-icon" }, "◌"),
                vue.createElementVNode("view", { class: "chart-title" }, "目标时间图"),
                vue.createElementVNode("view", { class: "chart-desc" }, "当前还没有可展示的普通目标，新增后会按开始、进行中、完成、放弃时间自动排布到时间轴。")
              ])) : (vue.openBlock(), vue.createElementBlock(
                "scroll-view",
                {
                  key: 1,
                  ref: "timelineScrollRef",
                  "scroll-x": "true",
                  class: "timeline-scroll",
                  "show-scrollbar": "false",
                  onWheelCapture: vue.withModifiers($setup.handleChartWheel, ["stop", "prevent"]),
                  onMousewheelCapture: vue.withModifiers($setup.handleChartWheel, ["stop", "prevent"])
                },
                [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "timeline-content",
                      style: vue.normalizeStyle({ width: $setup.chartTimeline.contentWidth })
                    },
                    [
                      vue.createElementVNode("view", { class: "timeline-axis" }, [
                        (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          null,
                          vue.renderList($setup.chartTimeline.ticks, (tick) => {
                            return vue.openBlock(), vue.createElementBlock(
                              "view",
                              {
                                key: tick.key,
                                class: "timeline-tick",
                                style: vue.normalizeStyle({ left: tick.left })
                              },
                              [
                                vue.createElementVNode("view", { class: "timeline-tick-line" }),
                                vue.createElementVNode(
                                  "text",
                                  { class: "timeline-tick-label" },
                                  vue.toDisplayString(tick.label),
                                  1
                                  /* TEXT */
                                )
                              ],
                              4
                              /* STYLE */
                            );
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        )),
                        $setup.chartTimeline.todayVisible ? (vue.openBlock(), vue.createElementBlock(
                          "view",
                          {
                            key: 0,
                            class: "timeline-today",
                            style: vue.normalizeStyle({ left: $setup.chartTimeline.todayLeft })
                          },
                          [
                            vue.createElementVNode("view", { class: "timeline-today-line" }),
                            vue.createElementVNode("text", { class: "timeline-today-label" }, "今天")
                          ],
                          4
                          /* STYLE */
                        )) : vue.createCommentVNode("v-if", true)
                      ]),
                      vue.createElementVNode("view", { class: "timeline-stage" }, [
                        vue.createElementVNode("view", { class: "timeline-stage-head" }, [
                          vue.createElementVNode("view", null, [
                            vue.createElementVNode("view", { class: "timeline-stage-title" }, "目标卡片区"),
                            vue.createElementVNode("view", { class: "timeline-stage-desc" }, "不再按区域拆分，全部目标统一排布，通过颜色和状态文字区分进行中、已完成、已放弃。")
                          ]),
                          vue.createElementVNode(
                            "view",
                            { class: "timeline-stage-count" },
                            vue.toDisplayString($setup.chartTimeline.count) + " 项",
                            1
                            /* TEXT */
                          )
                        ]),
                        vue.createElementVNode(
                          "view",
                          {
                            class: "timeline-stage-body",
                            style: vue.normalizeStyle({ height: $setup.chartTimeline.height })
                          },
                          [
                            (vue.openBlock(true), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList($setup.chartTimeline.ticks, (tick) => {
                                return vue.openBlock(), vue.createElementBlock(
                                  "view",
                                  {
                                    key: tick.key,
                                    class: "timeline-grid-line",
                                    style: vue.normalizeStyle({ left: tick.left })
                                  },
                                  null,
                                  4
                                  /* STYLE */
                                );
                              }),
                              128
                              /* KEYED_FRAGMENT */
                            )),
                            $setup.chartTimeline.todayVisible ? (vue.openBlock(), vue.createElementBlock(
                              "view",
                              {
                                key: 0,
                                class: "timeline-grid-line today",
                                style: vue.normalizeStyle({ left: $setup.chartTimeline.todayLeft })
                              },
                              null,
                              4
                              /* STYLE */
                            )) : vue.createCommentVNode("v-if", true),
                            !$setup.chartTimeline.items.length ? (vue.openBlock(), vue.createElementBlock("view", {
                              key: 1,
                              class: "timeline-stage-empty"
                            }, " 当前没有可展示的目标。 ")) : vue.createCommentVNode("v-if", true),
                            (vue.openBlock(true), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList($setup.chartTimeline.items, (item) => {
                                return vue.openBlock(), vue.createElementBlock("view", {
                                  key: item.id,
                                  class: vue.normalizeClass(["timeline-goal-card", [$setup.chartDisplayMode, item.status, { active: $setup.activeProofGoalId === item.id, tappable: item.status === "completed" && item.hasProof }]]),
                                  style: vue.normalizeStyle(item.style),
                                  onClick: ($event) => $setup.handleTimelineGoalTap(item)
                                }, [
                                  vue.createElementVNode(
                                    "view",
                                    {
                                      class: "timeline-goal-accent",
                                      style: vue.normalizeStyle({ background: item.color })
                                    },
                                    null,
                                    4
                                    /* STYLE */
                                  ),
                                  vue.createElementVNode("view", { class: "timeline-goal-head" }, [
                                    vue.createElementVNode(
                                      "text",
                                      { class: "timeline-goal-title" },
                                      vue.toDisplayString(item.title),
                                      1
                                      /* TEXT */
                                    ),
                                    vue.createElementVNode(
                                      "text",
                                      {
                                        class: "timeline-goal-badge",
                                        style: vue.normalizeStyle(item.badgeStyle)
                                      },
                                      vue.toDisplayString(item.eventLabel),
                                      5
                                      /* TEXT, STYLE */
                                    )
                                  ]),
                                  vue.createElementVNode(
                                    "view",
                                    { class: "timeline-goal-time" },
                                    vue.toDisplayString(item.timeText),
                                    1
                                    /* TEXT */
                                  ),
                                  $setup.chartDisplayMode !== "compact" && item.deadlineText ? (vue.openBlock(), vue.createElementBlock(
                                    "view",
                                    {
                                      key: 0,
                                      class: "timeline-goal-deadline"
                                    },
                                    " 截止：" + vue.toDisplayString(item.deadlineText),
                                    1
                                    /* TEXT */
                                  )) : vue.createCommentVNode("v-if", true),
                                  $setup.chartDisplayMode === "detail" && item.extraText ? (vue.openBlock(), vue.createElementBlock(
                                    "view",
                                    {
                                      key: 1,
                                      class: "timeline-goal-extra"
                                    },
                                    vue.toDisplayString(item.extraText),
                                    1
                                    /* TEXT */
                                  )) : vue.createCommentVNode("v-if", true),
                                  item.status === "completed" && item.hasProof ? (vue.openBlock(), vue.createElementBlock(
                                    "view",
                                    {
                                      key: 2,
                                      class: "timeline-goal-proof-tip"
                                    },
                                    vue.toDisplayString($setup.activeProofGoalId === item.id ? "点击收起完成凭证" : "点击展开完成凭证"),
                                    1
                                    /* TEXT */
                                  )) : vue.createCommentVNode("v-if", true),
                                  item.status === "completed" && $setup.activeProofGoalId === item.id ? (vue.openBlock(), vue.createElementBlock("view", {
                                    key: 3,
                                    class: "completion-popover",
                                    onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
                                    }, ["stop"]))
                                  }, [
                                    vue.createElementVNode("view", { class: "completion-popover-title" }, "完成凭证"),
                                    item.completionNote ? (vue.openBlock(), vue.createElementBlock(
                                      "view",
                                      {
                                        key: 0,
                                        class: "completion-popover-note"
                                      },
                                      vue.toDisplayString(item.completionNote),
                                      1
                                      /* TEXT */
                                    )) : vue.createCommentVNode("v-if", true),
                                    item.completionImages.length ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
                                      key: 1,
                                      "scroll-x": "true",
                                      class: "completion-image-scroll",
                                      "show-scrollbar": "false"
                                    }, [
                                      vue.createElementVNode("view", { class: "completion-image-row" }, [
                                        (vue.openBlock(true), vue.createElementBlock(
                                          vue.Fragment,
                                          null,
                                          vue.renderList(item.completionImages, (image, imageIndex) => {
                                            return vue.openBlock(), vue.createElementBlock("image", {
                                              key: image + imageIndex,
                                              class: "completion-popover-image",
                                              src: image,
                                              mode: "aspectFill"
                                            }, null, 8, ["src"]);
                                          }),
                                          128
                                          /* KEYED_FRAGMENT */
                                        ))
                                      ])
                                    ])) : vue.createCommentVNode("v-if", true),
                                    item.completionVideo ? (vue.openBlock(), vue.createElementBlock("video", {
                                      key: 2,
                                      class: "completion-popover-video",
                                      src: item.completionVideo,
                                      controls: "",
                                      "object-fit": "cover"
                                    }, null, 8, ["src"])) : vue.createCommentVNode("v-if", true)
                                  ])) : vue.createCommentVNode("v-if", true)
                                ], 14, ["onClick"]);
                              }),
                              128
                              /* KEYED_FRAGMENT */
                            ))
                          ],
                          4
                          /* STYLE */
                        )
                      ])
                    ],
                    4
                    /* STYLE */
                  )
                ],
                544
                /* NEED_HYDRATION, NEED_PATCH */
              ))
            ])
          ],
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ))
      ]),
      vue.createElementVNode("view", { class: "bottom-nav" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["nav-item", { active: $setup.activeTab === "home" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.switchTab("home"))
          },
          [
            vue.createElementVNode("text", { class: "nav-icon" }, "⌂"),
            vue.createElementVNode("text", { class: "nav-label" }, "首页")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["nav-item", { active: $setup.activeTab === "list" }]),
            onClick: _cache[4] || (_cache[4] = ($event) => $setup.switchTab("list"))
          },
          [
            vue.createElementVNode("text", { class: "nav-icon" }, "≣"),
            vue.createElementVNode("text", { class: "nav-label" }, "目标列表")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["nav-item", { active: $setup.activeTab === "chart" }]),
            onClick: _cache[5] || (_cache[5] = ($event) => $setup.switchTab("chart"))
          },
          [
            vue.createElementVNode("text", { class: "nav-icon" }, "⌇"),
            vue.createElementVNode("text", { class: "nav-label" }, "目标时间图")
          ],
          2
          /* CLASS */
        )
      ]),
      $setup.detailVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "detail-mask",
        onClick: $setup.closeDetail
      }, [
        vue.createElementVNode("view", {
          class: "detail-sheet",
          onClick: _cache[6] || (_cache[6] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "detail-sheet-head" }, [
            vue.createElementVNode("view", null, [
              vue.createElementVNode("view", { class: "detail-sheet-title" }, "目标详情"),
              vue.createElementVNode("view", { class: "detail-sheet-subtitle" }, "点击卡片内操作可直接编辑、删除或拆分子目标")
            ]),
            vue.createElementVNode("view", {
              class: "detail-sheet-close",
              onClick: $setup.closeDetail
            }, "×")
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "true",
            class: "detail-sheet-body"
          }, [
            $setup.selectedGoal ? (vue.openBlock(), vue.createBlock($setup["GoalNode"], {
              key: 0,
              goal: $setup.selectedGoal,
              level: 0,
              onSelect: $setup.openDetail,
              onEdit: $setup.openEdit,
              onDelete: $setup.confirmDelete,
              onAddChild: $setup.openCreateChild,
              onStatusChange: $setup.changeStatus
            }, null, 8, ["goal"])) : vue.createCommentVNode("v-if", true)
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode($setup["GoalFormDialog"], {
        visible: $setup.dialog.visible,
        mode: $setup.dialog.mode,
        "initial-value": $setup.dialog.initialValue,
        "parent-goal-title": $setup.dialog.parentGoalTitle,
        onClose: $setup.closeDialog,
        onSave: $setup.saveGoal
      }, null, 8, ["visible", "mode", "initial-value", "parent-goal-title"])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__file", "D:/book3/pages/index/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  const _sfc_main = {};
  function _sfc_render(_ctx, _cache) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "app-root" }, [
      vue.renderSlot(_ctx.$slots, "default")
    ]);
  }
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "D:/book3/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
