import type { Node } from "@xyflow/react";

/**
 * 计算哪些节点被选区完全包含
 * @param nodes 节点数组，每个节点有 { id, position: { x, y }, width, height }
 * @param selection 选区矩形 { x, y, width, height }
 */

/**
 * 获取选中的节点
 * @param nodes 节点数组
 * @param selection 选区矩形 { x, y, width, height }
 * @param isPartial 是否允许部分相交也算选中，默认 false（完整包含）
 */
export function getSelectedNodes(
  nodes: Node[],
  selection: { x: number; y: number; width: number; height: number },
  isPartial = true
): Node[] {
  return nodes.filter((node) => {
    if (!node.position || node.width == null || node.height == null)
      return false;

    const nodeBounds = {
      x: node.position.x,
      y: node.position.y,
      width: node.width,
      height: node.height,
    };

    if (isPartial) {
      // 部分相交即可
      return !(
        nodeBounds.x + nodeBounds.width < selection.x ||
        nodeBounds.x > selection.x + selection.width ||
        nodeBounds.y + nodeBounds.height < selection.y ||
        nodeBounds.y > selection.y + selection.height
      );
    } else {
      // 完全包含
      return (
        nodeBounds.x >= selection.x &&
        nodeBounds.y >= selection.y &&
        nodeBounds.x + nodeBounds.width <= selection.x + selection.width &&
        nodeBounds.y + nodeBounds.height <= selection.y + selection.height
      );
    }
  });
}

/**
 * 根据被选中的节点计算框选矩形
 * @param nodes 被选中的节点数组
 * @returns 框选矩形 { x, y, width, height }
 */
export function calculateSelectionRect(
  nodes: Node[]
): { x: number; y: number; width: number; height: number } | null {
  if (!nodes || nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (!node.position || node.width == null || node.height == null) continue;

    const x1 = node.position.x;
    const y1 = node.position.y;
    const x2 = node.position.x + node.width;
    const y2 = node.position.y + node.height;

    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
