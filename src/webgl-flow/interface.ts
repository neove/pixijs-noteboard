import { Node, Edge } from "@xyflow/react";
export interface WebGLFlowProps {
  root: HTMLDivElement;
  nodes: Node[];
  edges: Edge[];
}

export interface IFlowViewProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: any;
  controlMode: EControlMode;
}

export enum EControlMode {
  DRAG = "drag",
  SELECT = "select",
}

export enum EActionType {
  dragCard = "dragCard", // 拖拽卡片
  createSelectionBox = "createSelectionBox", // 创建选区框
  moveSelectionBox = "moveSelectionBox", // 移动选区框
}
