import { Node } from "@xyflow/react";
import { Container, Graphics, Text, HTMLText, Texture, Assets } from "pixi.js";
import { extend } from "@pixi/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

extend({
  Container,
  Graphics,
  Text,
  HtmlText: HTMLText,
});

interface INodeRendererProps {
  node: Node;
  setNodes: any;
  onDragStart: (nodeId: string, globalX: number, globalY: number) => void;
  isDragging: boolean;
  nodePosition: { x: number; y: number };
  setNodeContainer: (nodeId: string, container: Container) => void;
}

export const NodeRenderer = memo(
  ({
    node,
    onDragStart,
    isDragging,
    nodePosition,
    setNodeContainer,
  }: INodeRendererProps) => {
    const spriteRef = useRef(null);

    const [texture, setTexture] = useState(Texture.EMPTY);
    const [isHovered, setIsHover] = useState(false);
    const [isActive, setIsActive] = useState(false);

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

    useEffect(() => {
      if (containerRef.current) {
        setNodeContainer(node.id, containerRef.current);
      }
    }, [node.id, setNodeContainer]);
    console.log("render node", node.data?.label);

    // Preload the sprite if it hasn't been loaded yet
    useEffect(() => {
      if (texture === Texture.EMPTY) {
        Assets.load("https://myflexnote.com/images/main.png").then((result) => {
          setTexture(result);
        });
      }
    }, [texture]);
    return (
      <pixiContainer
        ref={containerRef}
        zIndex={isDragging ? 1000 : 0}
        eventMode="dynamic"
        x={nodePosition.x}
        y={nodePosition.y}
        onPointerDown={(e: any) => {
          e.stopPropagation();
          // 传递拖拽开始事件，包含节点ID和当前鼠标位置
          onDragStart(node.id, e.data.global.x, e.data.global.y);
        }}
      >
        <pixiGraphics draw={draw} />
        {/* <pixiSprite
          ref={spriteRef}
          eventMode={"static"}
          onClick={(event) => setIsActive(!isActive)}
          onPointerOver={(event) => setIsHover(true)}
          onPointerOut={(event) => setIsHover(false)}
          texture={texture}
          x={0}
          y={0}
          width={node.width}
          height={node.height}
        /> */}
      </pixiContainer>
    );
  }
);
