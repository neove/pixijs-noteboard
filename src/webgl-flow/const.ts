export const SELECTION_BOX_BACKGROUND_COLOR = 0x0000ff; // 选区背景颜色 浅色透明的蓝色
export const SELECTION_BOX_STYLE = {
  fill: { color: SELECTION_BOX_BACKGROUND_COLOR, alpha: 0.1 },
  stroke: { width: 1, color: "red" },
};
export const SELECTED_NODE_BORDER_COLOR = 0x0000ff; // 选中的节点边框颜色
export const SELECTED_NODE_BORDER_WIDTH = 2; // 选中的节点边框宽度
export const NORMAL_NODE_BORDER_COLOR = "#fff"; // 普通节点边框颜色
export const NORMAL_NODE_BORDER_WIDTH = 1; // 普通节点边框宽度

export const SELECTED_NODE_INDEX = 1000; // 选中节点层级
export const DEFAULT_NODE_STYLE = {
  fill: { color: "#ffffff" },
  stroke: { width: 2, color: "red" },
};

export const SELECTED_NODE_STYLE = {
  fill: { color: "#f0f0f0" },
  stroke: { width: 2, color: "#007aff" }, // 蓝色边框表示选中
};
