import { Application, extend, useApplication } from "@pixi/react";
import { Container, Graphics, Sprite, Text, HTMLText } from "pixi.js";
import { IFlowViewProps, WebGLFlowProps } from "./interface";
import { Viewport } from "pixi-viewport"; // 导入视口组件 https://viewport.pixijs.io/
import { useCallback, useEffect, useRef, useState } from "react";
import { NodeRenderer } from "./node";
import { ResizePanel } from "./resize-panel";
import { Node } from "@xyflow/react";
const BORDER = 10;
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
extend({
  Container,
  Graphics,
  Sprite,
  Text,
  HtmlText: HTMLText,
  Viewport,
});
export default function WebGLFlow({
  root,
  nodes: initialNodes,
  edges,
}: WebGLFlowProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  return (
    <Application
      backgroundColor="#eee"
      resizeTo={root}
      preference="webgpu"
      eventMode="static"
      hello
      // 关键配置：适配分辨率
      resolution={window.devicePixelRatio || 1} // 匹配屏幕 DPI（Retina 屏为 2）
      autoDensity={true} // 自动根据 resolution 调整渲染分辨率
    >
      <FlowView nodes={nodes} edges={edges} setNodes={setNodes} />
      {/* <ResizePanel zoom={1} /> */}
    </Application>
  );
}

const FlowView = ({ nodes, edges, setNodes }: IFlowViewProps) => {
  const viewportRef = useRef<Viewport>(null);
  const { app } = useApplication();
  // 节点图形缓存
  const nodeContainerMap = useRef<Map<string, Container>>(new Map());
  // 拖拽状态管理
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // ref
  const nodesRef = useRef<Node[]>(nodes);
  nodesRef.current = nodes;

  // 初始化视口
  useEffect(() => {
    if (viewportRef.current && app) {
      const viewport = viewportRef.current;
      viewport.drag().pinch().wheel();
    }
  }, [app]);

  // 初始化临时位置
  useEffect(() => {
    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node) => {
      initialPositions[node.id] = { ...node.position };
    });
  }, [nodes]);

  // 处理拖拽开始
  const handleDragStart = useCallback(
    (nodeId: string, screenX: number, screenY: number) => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node || !viewportRef.current) return;

      setDraggingNodeId(nodeId);

      // 关键：将屏幕坐标转换为世界坐标
      const worldPos = viewportRef.current.toWorld(screenX, screenY);

      // 计算偏移量：世界坐标 - 节点当前位置
      setDragOffset({
        x: worldPos.x - node.position.x,
        y: worldPos.y - node.position.y,
      });
    },
    []
  );

  // 处理鼠标移动（在应用层面监听）
  const handlePointerMove = useCallback(
    (e: any) => {
      if (!draggingNodeId || !viewportRef.current) return;

      // 获取屏幕坐标并转换为世界坐标
      const screenPos = e.data.global;
      const worldPos = viewportRef.current.toWorld(screenPos.x, screenPos.y);

      // 计算新位置：世界坐标 - 偏移量
      const newX = worldPos.x - dragOffset.x;
      const newY = worldPos.y - dragOffset.y;

      // 更新容器位置
      const container = nodeContainerMap.current.get(draggingNodeId);
      if (container) {
        container.x = newX;
        container.y = newY;
      }
      // 如果数量很大的话 这里 set 会出现性能问题 导致卡顿
      //   setNodes((prevNodes: Node[]) =>
      //     prevNodes.map((node) =>
      //       node.id === draggingNodeId
      //         ? { ...node, position: { x: newX, y: newY } }
      //         : node
      //     )
      //   );
    },
    [draggingNodeId, dragOffset]
  );

  // 处理拖拽结束
  const handlePointerUp = useCallback(() => {
    if (!draggingNodeId) return;
    setNodes((prevNodes: Node[]) =>
      prevNodes.map((node) => {
        const container = nodeContainerMap.current.get(node.id);
        if (container && draggingNodeId === node.id) {
          const newX = container.x;
          const newY = container.y;
          return { ...node, position: { x: newX, y: newY } };
        }
        return node;
      })
    );
    // 重置拖拽状态
    setDraggingNodeId(null);
  }, [draggingNodeId, setNodes]);

  // 在应用层面绑定全局鼠标事件
  useEffect(() => {
    if (!app) return;

    // 绑定全局移动和释放事件
    app.stage.on("pointermove", handlePointerMove);
    app.stage.on("pointerup", handlePointerUp);
    app.stage.on("pointerupoutside", handlePointerUp);
    app.stage.on("pointercancel", handlePointerUp);

    return () => {
      // 清理事件
      app.stage.off("pointermove", handlePointerMove);
      app.stage.off("pointerup", handlePointerUp);
      app.stage.off("pointerupoutside", handlePointerUp);
      app.stage.off("pointercancel", handlePointerUp);
    };
  }, [app, handlePointerMove, handlePointerUp]);

  const setNodeContainer = useCallback(
    (nodeId: string, container: Container) => {
      nodeContainerMap.current.set(nodeId, container);
    },
    []
  );

  return (
    <pixiViewport events={app?.renderer.events} ref={viewportRef}>
      {/* 背景网格 */}
      {/* <pixiGraphics
      // draw={(graphics) => {
      //   graphics.clear();
      //   graphics.lineTo(1, 0xeeeeee);

      //   // 绘制网格
      //   for (let i = 0; i <= WORLD_WIDTH; i += 100) {
      //     graphics.lineTo(i, 0);
      //     graphics.lineTo(0, i);
      //   }
      // }}
      /> */}

      {/* 绘制节点 */}
      {nodes.map((node) => (
        <NodeRenderer
          key={node.id}
          node={node}
          onDragStart={handleDragStart}
          isDragging={draggingNodeId === node.id}
          nodePosition={node.position}
          setNodeContainer={setNodeContainer}
        />
      ))}

      {/* 视口边界 */}
      <pixiGraphics
        draw={(graphics) => {
          if (app) {
            graphics.rect(0, 0, app.screen.width, app.screen.height).stroke({
              width: 2,
              color: "blue",
            });
          }
        }}
      />
    </pixiViewport>
  );
};
