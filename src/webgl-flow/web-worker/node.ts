import { Node } from "@xyflow/react";
self.onmessage = (event) => {
  const { nodes, selectedNodeIds, containerPositions } = event.data;

  const posMap = new Map(
    containerPositions.map((c) => [c.id, { x: c.x, y: c.y }])
  );

  const updatedNodes = nodes.map((node: Node) => {
    if (!selectedNodeIds.includes(node.id)) {
      return node;
    }
    const pos = posMap.get(node.id);
    return {
      ...node,
      position: { x: pos?.x ?? node.position.x, y: pos?.y ?? node.position.y },
    };
  });

  self.postMessage(updatedNodes);
};
