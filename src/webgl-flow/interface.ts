import { Node, Edge } from "@xyflow/react";
export interface WebGLFlowProps {
  root: HTMLDivElement;
  nodes: Node[];
  edges: Edge[];
  onNodeDragStop: (
    event: React.MouseEvent,
    node: Node,
    nodeList: Node[]
  ) => void;
}

export interface IFlowViewProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: any;
  onNodesUpdate: (
    nodes: {
      id: string;
      updates: any;
    }[]
  ) => void; // 节点更新
  controlMode: EControlMode;
  onSelectionMenuPositionChange: (
    props: { x: number; y: number } | null
  ) => void; // 选区菜单位置变化
  onNodeDragStop: (
    event: React.MouseEvent,
    node: Node,
    nodeList: Node[]
  ) => void;
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
