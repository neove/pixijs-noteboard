/***
 * Container 的 height 和 width 是计算包含了所有子元素的 height 和 width
 * 坐标转换
 * * const localPos = viewport.toLocal(worldPos); // 将世界坐标转换为局部坐标
 *
 */

import type { Node, Viewport } from "@xyflow/react";

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
  viewport: Viewport,
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
    // @ts-ignore
    const zoom = viewport.scale.x;

    if (isPartial) {
      // 部分相交即可
      return !(
        nodeBounds.x * zoom + nodeBounds.width * zoom < selection.x * zoom ||
        nodeBounds.x * zoom > selection.x * zoom + selection.width * zoom ||
        nodeBounds.y * zoom + nodeBounds.height * zoom < selection.y * zoom ||
        nodeBounds.y * zoom > selection.y * zoom + selection.height * zoom
      );
    } else {
      // 完全包含
      return (
        nodeBounds.x * zoom >= selection.x &&
        nodeBounds.y * zoom >= selection.y &&
        nodeBounds.x * zoom + nodeBounds.width * zoom <=
          selection.x * zoom + selection.width * zoom &&
        nodeBounds.y * zoom + nodeBounds.height * zoom <=
          selection.y * zoom + selection.height * zoom
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

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 节点 a 是否完全在节点 b 内
 */
export function isNodeFullyInside(a: NodeBounds, b: NodeBounds): boolean {
  return (
    a.x >= b.x &&
    a.y >= b.y &&
    a.x + a.width <= b.x + b.width &&
    a.y + a.height <= b.y + b.height
  );
}

/**
 * 节点 a 是否部分在节点 b 内（相交即可）
 */
export function isNodePartiallyInside(a: NodeBounds, b: NodeBounds): boolean {
  return (
    !(
      (
        a.x + a.width < b.x || // a 在 b 左边
        a.x > b.x + b.width || // a 在 b 右边
        a.y + a.height < b.y || // a 在 b 上方
        a.y > b.y + b.height
      ) // a 在 b 下方
    ) &&
    !isNodeFullyInside(a, b) &&
    !isNodeFullyInside(b, a)
  );
}

/**
 * 节点 a 是否完全在节点 b 外
 */
export function isNodeFullyOutside(a: NodeBounds, b: NodeBounds): boolean {
  return (
    a.x + a.width <= b.x || // a 在 b 左边
    a.x >= b.x + b.width || // a 在 b 右边
    a.y + a.height <= b.y || // a 在 b 上方
    a.y >= b.y + b.height // a 在 b 下方
  );
}
