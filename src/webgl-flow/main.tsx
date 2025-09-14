import WebGLFlow from "./app";
import React, { useRef } from "react";

export default function App() {
  // 遍历生成 100 个卡片
  const size = Math.random() * 200;
  const nodes = Array.from({ length: 40 }, (_, index) => ({
    id: `node-${index}`,
    data: { label: `Node ${index}` },
    position: { x: Math.random() * 1000, y: Math.random() * 1000 },
    width: size,
    height: size,
  }));

  // 遍历生成 100 条边
  const edges = Array.from({ length: 100 }, (_, index) => ({
    id: `edge-${index}`,
    source: `node-${Math.floor(Math.random() * 100)}`,
    target: `node-${Math.floor(Math.random() * 100)}`,
  }));

  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={{ width: "100%", height: "100vh" }}>
      <WebGLFlow root={ref} nodes={nodes} edges={edges} />
    </div>
  );
}
