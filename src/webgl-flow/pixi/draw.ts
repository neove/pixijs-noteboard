/**
 * 节点绘制的方法集合
 * 使用场景： 在 app 中绘制节点
 * 所有需要绘制节点的地方 都可以使用这个
 * 统一管理 节点绘制
 */

import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics } from "pixi.js";
import {
  DEFAULT_NODE_STYLE,
  SELECTED_NODE_INDEX,
  SELECTED_NODE_STYLE,
  SELECTION_BOX_INDEX,
  SELECTION_BOX_STYLE,
} from "../const";
import { Node } from "@xyflow/react";

export class FlowDraw {
  private app: Application;
  private viewport: Viewport;
  nodeContainerMap = new Map<string, Container>();
  constructor(props: { app?: Application; viewport?: Viewport }) {
    if (props.app) {
      this.app = props.app;
    }
    if (props.viewport) {
      this.viewport = props.viewport;
    }
    this.nodeContainerMap = new Map<string, Container>();
  }
  init(
    app: Application,
    viewport: Viewport,
    nodeContainerMap: Map<string, Container>
  ) {
    if (app) {
      this.app = app;
    }
    if (viewport) {
      this.viewport = viewport;
    }
    if (nodeContainerMap) {
      this.nodeContainerMap = nodeContainerMap;
    }
  }

  // 批量绘制被选中的节点
  updateSelectedNodes(nodes: Node[]) {
    for (const node of nodes) {
      const container = this.nodeContainerMap.get(node.id);
      if (!container) {
        continue;
      }
      container.zIndex = SELECTED_NODE_INDEX;

      const graphics = container.getChildAt(0) as Graphics;
      graphics.clear();
      graphics
        .rect(0, 0, node.width as number, node.height as number)
        .fill(SELECTED_NODE_STYLE.fill)
        .stroke(SELECTED_NODE_STYLE.stroke);
    }
  }
  // 重置被选中的节点
  resetSelectedNodes(nodes: Node[]) {
    for (const node of nodes) {
      const container = this.nodeContainerMap.get(node?.id);
      if (!container) {
        continue;
      }
      container.zIndex = 0;
      const graphics = container.getChildAt(0) as Graphics;
      graphics
        .clear()
        .rect(0, 0, node.width as number, node.height as number)
        .fill(DEFAULT_NODE_STYLE.fill)
        .stroke(DEFAULT_NODE_STYLE.stroke);
    }
  }
  // 绘制选区
  drawSelectionBox(
    selectionBoxGraphics: Graphics,
    {
      x,
      y,
      width,
      height,
    }: { x: number; y: number; width: number; height: number },
    eventMode: "none" | "static" = "none"
  ) {
    selectionBoxGraphics.clear();
    selectionBoxGraphics.eventMode = eventMode; // 禁止选区框的点击事件 不然会触发选区框的点击事件
    selectionBoxGraphics.zIndex = SELECTION_BOX_INDEX;
    selectionBoxGraphics
      .rect(x, y, width, height)
      .fill(SELECTION_BOX_STYLE.fill)
      .stroke(SELECTION_BOX_STYLE.stroke);
  }
}
export const flowDraw = new FlowDraw({});
