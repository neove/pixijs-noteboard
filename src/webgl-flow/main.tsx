import WebGLFlow from "./app";
import React, { useRef } from "react";

export default function App() {
  // 遍历生成 100 个卡片
  const size = Math.random() * 200;
  // const nodes = Array.from({ length: 10 }, (_, index) => ({
  //   id: `node-${index}`,
  //   data: { label: `Node ${index}` },
  //   position: { x: Math.random() * 1000, y: Math.random() * 1000 },
  //   width: size,
  //   height: size,
  // }));
  const nodes = [
    {
      id: "node-0",
      data: { label: "Node 1" },
      position: { x: 100, y: 100 },
      width: 800,
      height: 900,
      type: "NodeGroup",
    },
    {
      id: "node-1",
      data: { label: "Node 1" },
      position: { x: 200, y: 200 },
      width: 400,
      height: 300,
      type: "NodeGroup",
      parentId: "node-0",
    },
    {
      id: "node-2",
      data: { label: "child Node 2" },
      position: { x: 100, y: 100 },
      width: 100,
      height: 150,
      parentId: "node-1",
    },
    {
      id: "node-3",
      data: { label: "child Node 3" },
      position: { x: 10, y: 10 },
      width: 50,
      height: 50,
    },
  ];

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
