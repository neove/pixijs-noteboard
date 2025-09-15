import { Node } from "@xyflow/react";
import { Container, Graphics, Text, HTMLText, Texture, Assets } from "pixi.js";
import { extend } from "@pixi/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { SELECTED_NODE_INDEX } from "./const";

extend({
  Container,
  Graphics,
  Text,
  HtmlText: HTMLText,
});

interface INodeRendererProps {
  node: Node;
  nodesRef: React.RefObject<Node[]>;
  setNodes: any;
  onDragStart: (nodeId: string, globalX: number, globalY: number) => void;
  isDragging: boolean;
  nodePosition: { x: number; y: number };
  setNodeContainer: (nodeId: string, container: Container) => void;
  draggingNode: Node | undefined;
}

export const NodeRenderer = memo(
  ({
    node,
    onDragStart,
    isDragging,
    setNodeContainer,
    nodesRef,
    setNodes,
    draggingNode,
  }: INodeRendererProps) => {
    const draggingNodeId = draggingNode?.id;
    const isGroupNode = node.type === "NodeGroup";
    const containerRef = useRef<Container>(null);
    const draw = useCallback(
      (graphics: Graphics) => {
        //   if (!isDragging) {
        //     return;
        //   }
        console.log("drawnode", node.data?.label);
        graphics.clear();
        graphics
          .rect(0, 0, node.width as number, node.height as number)
          .fill({
            color: isDragging ? "#f0f0f0" : "#fff",
          })
          .stroke({
            width: 2,
            color: isDragging ? "#2c3e50" : "red",
          });
      },
      [node.width, node.height, isDragging]
    );
    const renderChild = () => {
      return nodesRef.current
        ?.filter((i) => i.parentId === node.id)
        .map((i) => {
          const isDragging = draggingNodeId === i.id;
          return (
            <NodeRenderer
              key={i.id}
              node={i}
              nodesRef={nodesRef}
              setNodes={setNodes}
              onDragStart={onDragStart}
              isDragging={isDragging}
              setNodeContainer={setNodeContainer}
              draggingNode={draggingNode}
            ></NodeRenderer>
          );
        });
    };
    const drawHandle = useCallback(
      (graphics: Graphics) => {
        graphics.clear();

        const width = 40;
        const height = 20;
        const radius = 6; // 圆角
        const x = 0;
        const y = -height; // 手柄在节点上方

        // 背景渐变填充
        graphics.beginFill(0x2c3e50, 1);
        graphics.lineStyle(1, 0x000000, 0.3); // 边框
        graphics.drawRoundedRect(x, y, width, height, radius);
        graphics.endFill();

        // 阴影效果（通过叠加半透明矩形模拟）
        graphics.beginFill(0x000000, 0.1);
        graphics.drawRoundedRect(x + 1, y + 1, width, height, radius);
        graphics.endFill();

        // 绘制中心小图标（比如三条横线，表示拖动）
        const iconWidth = 20;
        const iconHeight = 2;
        const gap = 4;
        graphics.beginFill(0xffffff, 0.9);
        for (let i = 0; i < 3; i++) {
          graphics.drawRect(
            x + (width - iconWidth) / 2,
            y + 4 + i * (iconHeight + gap),
            iconWidth,
            iconHeight
          );
        }
        graphics.endFill();
      },
      [node.width, node.height]
    );

    const renderGroupDragHandle = () => {
      return (
        <pixiContainer
          x={0}
          y={0}
          eventMode="dynamic"
          interactive
          onPointerDown={(e: any) => {
            e.stopPropagation();
            // 传递拖拽开始事件，包含节点ID和当前鼠标位置
            onDragStart(node.id, e.data.global.x, e.data.global.y);
          }}
        >
          <pixiGraphics draw={drawHandle} cursor="grab" />
        </pixiContainer>
      );
    };
    useEffect(() => {
      if (containerRef.current) {
        setNodeContainer(node.id, containerRef.current);
      }
    }, [node.id, setNodeContainer]);
    console.log("render node", node.data?.label);
    return (
      <pixiContainer
        ref={containerRef}
        zIndex={
          isDragging || node.id === draggingNode?.parentId
            ? SELECTED_NODE_INDEX
            : 0
        }
        eventMode={isGroupNode ? "passive" : "dynamic"}
        x={node.position.x}
        y={node.position.y}
        onPointerDown={(e: any) => {
          e.stopPropagation();
          // 传递拖拽开始事件，包含节点ID和当前鼠标位置
          onDragStart(node.id, e.data.global.x, e.data.global.y);
        }}
      >
        {/* 绘制节点区域 必须是第一个节点位置 */}

        <pixiGraphics draw={draw} cursor={isDragging ? "grabbing" : "grab"} />
        <pixiText
          style={{
            fontSize: 12,
          }}
          text={`${Math.round(node.position.x)} ${Math.round(node.position.y)}`}
        />
        <pixiText
          style={{
            fontSize: 12,
          }}
          y={20}
          text={node.data?.label}
        />
        <pixiText
          style={{
            fontSize: 12,
          }}
          y={40}
          text={`width:${node.width} height:${node.height}`}
        />
        {isGroupNode && renderGroupDragHandle()}
        {node.type === "NodeGroup" ? renderChild() : null}
      </pixiContainer>
    );
  }
  // ,
  // (prevProps, nextProps) => {
  //   // 自定义比较逻辑
  //   const changedProps = [];

  //   // 检查所有 props 的变化
  //   for (const key in prevProps) {
  //     if (!Object.is(prevProps[key], nextProps[key])) {
  //       changedProps.push(key);
  //     }
  //   }

  //   if (changedProps.length > 0) {
  //     console.log(`Props 变化: ${changedProps.join(", ")}`);
  //     console.log("前值:", prevProps);
  //     console.log("后值:", nextProps);
  //   }

  //   // 返回 true 表示 props 未变（不重新渲染），false 表示需要重新渲染
  //   return changedProps.length === 0;
  // }
);
