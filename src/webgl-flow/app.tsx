import { Application, extend, useApplication } from "@pixi/react";
import { Container, Graphics, Sprite, Text, HTMLText } from "pixi.js";
import {
  EActionType,
  EControlMode,
  IFlowViewProps,
  WebGLFlowProps,
} from "./interface";
import { Viewport } from "pixi-viewport"; // 导入视口组件 https://viewport.pixijs.io/
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NodeRenderer } from "./node";
import { ResizePanel } from "./resize-panel";
import { Node } from "@xyflow/react";
import { CanvasContext } from "./context";
import { SelectionBox } from "./selection-box";
import {
  DEFAULT_NODE_STYLE,
  NORMAL_NODE_BORDER_COLOR,
  SELECTED_NODE_BORDER_COLOR,
  SELECTED_NODE_INDEX,
  SELECTED_NODE_STYLE,
  SELECTION_BOX_BACKGROUND_COLOR,
  SELECTION_BOX_STYLE,
} from "./const";
import {
  calculateSelectionRect,
  getSelectedNodes,
  isNodeFullyInside,
  isNodeFullyOutside,
  isNodePartiallyInside,
} from "./utils";
import { NodeGroupRenderer } from "./node-group";
import { flowDraw } from "./pixi/draw";
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
let emptyFn = () => {};
const worker = new Worker(new URL("./web-worker/index.ts", import.meta.url));

export default function WebGLFlow({
  root,
  nodes: initialNodes,
  edges,
  onNodeDragStop = emptyFn,
}: WebGLFlowProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [controlMode, setControlMode] = useState<EControlMode>(
    EControlMode.SELECT
  );
  // 选区框的边界
  const [selectionMenuBounds, setSelectionMenuBounds] = useState<{
    x: number;
    y: number;
  } | null>(null);
  return (
    <>
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
        <FlowView
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          controlMode={controlMode}
          onNodeDragStop={onNodeDragStop}
          onSelectionMenuPositionChange={setSelectionMenuBounds}
        />
      </Application>
      {selectionMenuBounds && (
        <div
          style={{
            position: "fixed",
            top: selectionMenuBounds.y,
            left: selectionMenuBounds.x,
          }}
        >
          NewGroup
        </div>
      )}
      <button
        style={{ position: "absolute", top: 0, left: 0 }}
        onClick={() =>
          setControlMode(
            controlMode === EControlMode.SELECT
              ? EControlMode.DRAG
              : EControlMode.SELECT
          )
        }
      >
        {controlMode}
      </button>
    </>
  );
}

const FlowView = ({
  nodes,
  edges,
  setNodes,
  controlMode,
  onNodeDragStop,
  onSelectionMenuPositionChange,
  onNodesUpdate,
}: IFlowViewProps) => {
  const viewportRef = useRef<Viewport>(null);
  const { app } = useApplication();
  // 节点图形缓存
  const nodeContainerMap = useRef<Map<string, Container>>(new Map());
  // 拖拽状态管理
  const draggingNodeRef = useRef<Node | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  // ref
  const mouseActionTypeRef = useRef<EActionType>(); // 当前的鼠标动作类型
  const nodesRef = useRef<Node[]>(nodes);
  nodesRef.current = nodes;
  const selectionStart = useRef<{ x: number; y: number } | null>(null); // 选区起始点
  //如果要在 React 层用这个矩形（比如定位菜单），你需要自己保存 selectionRect：
  const selectionBoundsRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    deltaX: number;
    deltaY: number;
  } | null>(null);
  const draggingSelectingBoxStartPos = useRef<{ x: number; y: number } | null>(
    null
  ); // 选区框起始点
  const selectionBoxGraphicsRef = useRef<Graphics>(null); // 选区框容器
  const selectedNodesRef = useRef<Node[]>([]); // 选中的节点
  // 用于记录选中节点的初始位置
  const selectedNodesStartPosRef = useRef<
    Map<string, { x: number; y: number }>
  >(new Map());

  const handleStagePointerDown = useCallback(
    (e: any) => {
      // 创建选区
      if (controlMode === EControlMode.SELECT) {
        if (e.button === 2) {
          return;
        }
        const worldPos = viewportRef.current?.toWorld(e.global.x, e.global.y);
        if (worldPos) {
          selectionStart.current = worldPos;
        }
      }
    },
    [controlMode]
  );

  /***
   * 处理拖拽开始
   * 性能方面考虑 大批量节点的情况下 如果这里调用 setState 会导致掉帧，所以这里使用 ref 来管理
   * 涉及到 UI 状态 直接操作 pixijs 绘制节点
   * */
  const handleNodeDragStart = useCallback(
    (nodeId: string, screenX: number, screenY: number) => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node || !viewportRef.current) return;
      mouseActionTypeRef.current = EActionType.dragCard;
      draggingNodeRef.current = node;
      // 关键：将屏幕坐标转换为世界坐标
      const worldPos = viewportRef.current.toWorld(screenX, screenY);
      // 计算偏移量：世界坐标 - 节点当前位置
      dragOffsetRef.current = {
        x: worldPos.x - node.position.x,
        y: worldPos.y - node.position.y,
      };
      flowDraw.updateSelectedNodes([node]);
    },
    []
  );

  // 处理选区框拖拽开始 是拖拽 不是框选啊
  const handleSelectingBoxDragStart = useCallback((e: any) => {
    if (!viewportRef.current) return;

    const worldPos = viewportRef.current.toWorld(
      e.data.global.x,
      e.data.global.y
    );
    draggingSelectingBoxStartPos.current = { ...worldPos };
    mouseActionTypeRef.current = EActionType.moveSelectionBox;
    // 计算偏移量：世界坐标 - 节点当前位置
    dragOffsetRef.current = {
      x: worldPos.x - selectionBoxGraphicsRef.current!.x,
      y: worldPos.y - selectionBoxGraphicsRef.current!.y,
    };
    // 记录每个被选中节点的初始位置
    selectedNodesRef.current.forEach((node) => {
      const container = nodeContainerMap.current.get(node.id);
      if (container) {
        selectedNodesStartPosRef.current.set(node.id, {
          x: container.x,
          y: container.y,
        });
      }
    });
  }, []);

  // 处理选区框拖拽结束
  const handleSelectingBoxDragEnd = useCallback((e: any) => {
    mouseActionTypeRef.current = undefined;
    // 更新 nodes
    requestAnimationFrame(() => {
      setNodes((prevNodes: Node[]) =>
        prevNodes.map((node) => {
          if (!selectedNodesRef.current.find((n) => n.id === node.id)) {
            return node;
          }
          const container = nodeContainerMap.current.get(node.id);
          if (container) {
            return { ...node, position: { x: container.x, y: container.y } };
          }
          return node;
        })
      );
    });
    onNodeDragStop(e, selectedNodesRef.current[0], selectedNodesRef.current);
  }, []);

  // 处理鼠标移动（在应用层面监听）
  const handlePointerMove = useCallback(
    (e: any) => {
      if (!viewportRef.current) return;
      // 选区 超过一定距离才判断开启选区
      if (
        selectionStart.current &&
        Math.abs(selectionStart.current.x - e.data.global.x) > 10 &&
        Math.abs(selectionStart.current.y - e.data.global.y) > 10
      ) {
        mouseActionTypeRef.current = EActionType.createSelectionBox;
        selectionBoxGraphicsRef.current!.x = 0;
        selectionBoxGraphicsRef.current!.y = 0;
        // 获取屏幕坐标并转换为世界坐标
        const screenPos = e.data.global;
        const worldPos = viewportRef.current?.toWorld(screenPos.x, screenPos.y);
        // 绘制选区
        if (worldPos) {
          selectionBoxGraphicsRef.current!.clear();
          selectionBoxGraphicsRef.current!.eventMode = "none"; // 禁止选区框的点击事件 不然会触发选区框的点击事件
          const x = Math.min(selectionStart.current.x, worldPos.x);
          const y = Math.min(selectionStart.current.y, worldPos.y);
          const width = Math.abs(worldPos.x - selectionStart.current.x);
          const height = Math.abs(worldPos.y - selectionStart.current.y);
          selectionBoxGraphicsRef
            .current!.rect(x, y, width, height)
            .fill(SELECTION_BOX_STYLE.fill)
            .stroke(SELECTION_BOX_STYLE.stroke);
          // 计算选中的节点
          const currentSelectedNodes = getSelectedNodes(
            nodesRef.current,
            {
              x,
              y,
              width,
              height,
            },
            viewportRef.current as any
          );
          // 清除上一次选中的节点
          selectedNodesRef.current.forEach((node) => {
            const container = nodeContainerMap.current.get(node.id);
            if (container) {
              const graphics = container.getChildAt(0) as Graphics;
              graphics.clear();
              graphics
                .rect(0, 0, node.width as number, node.height as number)
                .fill(DEFAULT_NODE_STYLE.fill)
                .stroke(DEFAULT_NODE_STYLE.stroke);
            }
          });

          // 更新选中节点的UI
          currentSelectedNodes.forEach((node) => {
            const container = nodeContainerMap.current.get(node.id);
            if (container) {
              const graphics = container.getChildAt(0) as Graphics;
              graphics.clear();
              graphics
                .rect(0, 0, node.width as number, node.height as number)
                .fill(SELECTED_NODE_STYLE.fill)
                .stroke(SELECTED_NODE_STYLE.stroke);
            }
          });

          // 更新选中的节点
          selectedNodesRef.current = currentSelectedNodes;
        }
        return;
      }
      // 获取屏幕坐标并转换为世界坐标
      const screenPos = e.data.global;
      const worldPos = viewportRef.current.toWorld(screenPos.x, screenPos.y);

      // 计算新位置：世界坐标 - 偏移量
      const newX = worldPos.x - dragOffsetRef.current.x;
      const newY = worldPos.y - dragOffsetRef.current.y;
      // 拖拽节点
      if (draggingNodeRef.current && viewportRef.current) {
        // 更新容器位置
        const container = nodeContainerMap.current.get(
          draggingNodeRef.current.id
        );
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
      }
      // 拖拽选区框
      if (mouseActionTypeRef.current === EActionType.moveSelectionBox) {
        const dx = worldPos.x - draggingSelectingBoxStartPos.current!.x;
        const dy = worldPos.y - draggingSelectingBoxStartPos.current!.y;
        selectionBoxGraphicsRef.current!.x = newX;
        selectionBoxGraphicsRef.current!.y = newY;
        // 相对屏幕的坐标
        const menuPos = viewportRef.current!.toScreen(
          newX + selectionBoundsRef.current!.x,
          newY + selectionBoundsRef.current!.y
        );
        selectionBoundsRef.current!.deltaX = newX;
        selectionBoundsRef.current!.deltaY = newY;
        onSelectionMenuPositionChange({
          x: menuPos.x,
          y: menuPos.y,
        });
        // 移动被选中的节点
        selectedNodesRef.current.forEach((node) => {
          const container = nodeContainerMap.current.get(node.id);
          const startPos = selectedNodesStartPosRef.current.get(node.id);
          if (container && startPos && !node.parentId) {
            container.x = startPos.x + dx;
            container.y = startPos.y + dy;
          }
        });
      }
    },
    [draggingNodeRef.current]
  );

  // 处理拖拽结束
  const handlePointerUp = useCallback(
    (e: any) => {
      if (e.button === 2) {
        return;
      }

      if (mouseActionTypeRef.current === EActionType.createSelectionBox) {
        const selectionRect = calculateSelectionRect(selectedNodesRef.current);
        if (selectionRect) {
          const menuPos = viewportRef.current?.toScreen({
            x: selectionRect.x,
            y: selectionRect.y,
          });
          onSelectionMenuPositionChange({
            x: menuPos?.x as number,
            y: menuPos?.y as number,
          });
          selectionBoxGraphicsRef.current!.clear();
          selectionBoxGraphicsRef.current!.eventMode = "static";
          selectionBoundsRef.current = {
            x: selectionRect.x,
            y: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            deltaX: 0,
            deltaY: 0,
          };
          selectionBoxGraphicsRef
            .current!.rect(
              selectionRect.x,
              selectionRect.y,
              selectionRect.width,
              selectionRect.height
            )
            .fill(SELECTION_BOX_STYLE.fill)
            .stroke(SELECTION_BOX_STYLE.stroke);
        } else {
          selectionBoxGraphicsRef.current!.clear();
        }
        selectionStart.current = null;
        mouseActionTypeRef.current = undefined;
        return;
      }
      // 如果拖拽的是节点
      if (draggingNodeRef.current) {
        const targetNode = nodesRef.current.find(
          (n) => n.id === draggingNodeRef.current.id
        ) as Node;
        let parentId = targetNode.parentId;
        // 1️⃣ 找到当前鼠标悬停的分组节点（如果有）
        let hoverGroupNode: Node | undefined;
        const targetNodeContainer = nodeContainerMap.current.get(targetNode.id);

        for (const node of nodesRef.current) {
          if (
            node.type === "NodeGroup" &&
            node.id !== targetNode.id &&
            node.parentId !== targetNode.id
          ) {
            const groupContainer = nodeContainerMap.current.get(node.id);
            if (groupContainer) {
              const groupBounds = (
                groupContainer.getChildAt(0) as Graphics
              ).getBounds();
              const childBounds = (
                targetNodeContainer!.getChildAt(0) as Graphics
              ).getBounds();
              if (
                isNodePartiallyInside(childBounds, groupBounds) ||
                isNodeFullyInside(childBounds, groupBounds)
              ) {
                hoverGroupNode = node;
                break;
              }
            }
          }
        }
        // 如果节点有父节点 则判断是否拖出了分组或者拖入了其他分组
        if (targetNode.parentId) {
          let rawParentContainer = nodeContainerMap.current.get(
            targetNode.parentId
          );
          // 判断子节点是否完全在父节点内
          if (rawParentContainer && targetNodeContainer) {
            const parentRect = (
              rawParentContainer.getChildAt(0) as Graphics
            )?.getBounds(); // 返回的是 全局坐标系（世界坐标）下的边界矩形，而不是相对容器本身的局部坐标。返回的 是包围整个容器及其所有子元素的世界坐标边界。
            const childRect = (
              targetNodeContainer.getChildAt(0) as Graphics
            )?.getBounds();
            // 判断子节点是否部分在父节点内 需要更新父容器的尺寸和位置
            if (isNodePartiallyInside(childRect, parentRect)) {
            }
            if (isNodeFullyOutside(childRect, parentRect)) {
              parentId = "";
              // ⚠️ 从当前容器彻底移除
              rawParentContainer.removeChild(targetNodeContainer);
              // 如果子节点完全在父节点外
              const newChildPos = viewportRef.current!.toLocal(childRect); // 将子节点的世界坐标转换为局部坐标
              targetNodeContainer.x = newChildPos.x;
              targetNodeContainer.y = newChildPos.y;
              viewportRef.current!.addChild(targetNodeContainer);
            }
          }
        }
        // 3️⃣ 判断是否拖入了新的分组
        if (hoverGroupNode) {
          const newParentContainer = nodeContainerMap.current.get(
            hoverGroupNode.id
          );
          if (newParentContainer) {
            parentId = hoverGroupNode.id;
            viewportRef.current!.removeChild(targetNodeContainer!);
            const childWorldPos = targetNodeContainer!.getGlobalPosition();
            newParentContainer.addChild(targetNodeContainer!);
            const newPos = newParentContainer.toLocal(childWorldPos, app.stage);
            targetNodeContainer!.x = newPos.x;
            targetNodeContainer!.y = newPos.y;
            targetNode.parentId = hoverGroupNode.id;
          }
        }
        onNodeDragStop(e, targetNode, [targetNode]);
        const draggingNodeId = draggingNodeRef.current?.id;
        setNodes((prevNodes: Node[]) =>
          prevNodes.map((node) => {
            const container = nodeContainerMap.current.get(node.id);
            if (container && draggingNodeId === node.id) {
              const newX = container.x;
              const newY = container.y;
              return { ...node, position: { x: newX, y: newY }, parentId };
            }
            return node;
          })
        );
      }

      // 清空选区
      selectionBoxGraphicsRef.current?.clear();
      selectionBoxGraphicsRef.current!.x = 0;
      selectionBoxGraphicsRef.current!.y = 0;
      selectionStart.current = null;
      // 重置选中节点的UI 点击画布空白处
      selectedNodesRef.current.forEach((node) => {
        const container = nodeContainerMap.current.get(node.id);
        if (container) {
          const graphics = container.getChildAt(0) as Graphics;
          graphics.clear();
          graphics
            .rect(0, 0, node.width as number, node.height as number)
            .fill(DEFAULT_NODE_STYLE.fill)
            .stroke(DEFAULT_NODE_STYLE.stroke);
        }
      });
      selectedNodesRef.current = [];
      // 重置拖拽状态
      flowDraw.resetSelectedNodes([draggingNodeRef.current as Node]);
      draggingNodeRef.current = null;
      mouseActionTypeRef.current = undefined;
      draggingSelectingBoxStartPos.current = null;
      mouseActionTypeRef.current = undefined;
      onSelectionMenuPositionChange(null);
      selectionBoundsRef.current = null;
    },
    [setNodes]
  );

  // 初始化视口
  useEffect(() => {
    if (viewportRef.current && app) {
      flowDraw.init(app, viewportRef.current, nodeContainerMap.current);
      // 阻止右键默认菜单
      app.canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
      const viewport = viewportRef.current;
      viewport
        .drag({
          mouseButtons: controlMode === EControlMode.SELECT ? "right" : "left",
        })
        .pinch()
        .wheel();
      // 同步更新选区菜单位置
      const updateMenuPos = () => {
        if (selectionBoundsRef.current) {
          const menuPos = viewport.toScreen(
            selectionBoundsRef.current.x + selectionBoundsRef.current.deltaX,
            selectionBoundsRef.current.y + selectionBoundsRef.current.deltaY
          );
          onSelectionMenuPositionChange({
            x: menuPos.x,
            y: menuPos.y,
          });
        }
      };
      const handleMoved = (e: any) => {
        updateMenuPos();
      };

      const handleZoomed = (e: any) => {
        console.log("zoomed", e.viewport.scale.x);
        updateMenuPos();
      };
      // 监听视口移动和缩放事件
      viewport.on("moved", handleMoved);
      viewport.on("zoomed", handleZoomed);
      viewport.on("pinched", handleZoomed);
    }
  }, [app, controlMode]);

  // 初始化临时位置
  useEffect(() => {
    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node) => {
      initialPositions[node.id] = { ...node.position };
    });
  }, [nodes]);

  // 在应用层面绑定全局鼠标事件
  useEffect(() => {
    if (!app) return;

    // 绑定全局移动和释放事件
    app.stage.on("pointermove", handlePointerMove);
    app.stage.on("pointerup", handlePointerUp);
    app.stage.on("pointerupoutside", handlePointerUp);
    // app.stage.on("pointercancel", handlePointerUp);
    app.stage.on("pointerdown", handleStagePointerDown);

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
      flowDraw.nodeContainerMap.set(nodeId, container);
    },
    []
  );
  const draggingNode = useMemo(() => {
    return nodes.find((i) => i.id === draggingNodeRef.current?.id);
  }, [draggingNodeRef.current, nodes]);
  // 非分组节点
  const notChildNodes = useMemo(() => {
    return nodes.filter((i) => !i.parentId);
  }, [nodes]);
  return (
    <CanvasContext.Provider value={{ app, viewport: viewportRef.current }}>
      <pixiViewport
        events={app?.renderer.events}
        ref={viewportRef}
        onPointerDown={(e) => {
          e.preventDefault();
        }}
      >
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
        {notChildNodes.map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            onDragStart={handleNodeDragStart}
            isDragging={draggingNodeRef.current?.id === node.id}
            setNodeContainer={setNodeContainer}
            nodesRef={nodesRef}
            setNodes={setNodes}
            draggingNode={draggingNode}
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
        <SelectionBox
          selectionBoxGraphicsRef={selectionBoxGraphicsRef}
          onPointerDown={handleSelectingBoxDragStart}
          onPointerUp={handleSelectingBoxDragEnd}
        />
      </pixiViewport>
    </CanvasContext.Provider>
  );
};
