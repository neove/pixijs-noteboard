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
}
