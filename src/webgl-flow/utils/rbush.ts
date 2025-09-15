import RBush from "rbush";

// 节点边界类型
export interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// RBush 内部使用的矩形类型
interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  data: NodeBounds;
}

// 碰撞检测树
export class CollisionTree {
  private tree: RBush<RBushItem>;

  constructor(maxEntries = 9) {
    this.tree = new RBush<RBushItem>(maxEntries);
  }

  // 将 NodeBounds 转换成 RBushItem
  private toItem(node: NodeBounds): RBushItem {
    return {
      minX: node.x,
      minY: node.y,
      maxX: node.x + node.width,
      maxY: node.y + node.height,
      id: node.id,
      data: node,
    };
  }

  // 添加节点
  insert(node: NodeBounds) {
    this.tree.insert(this.toItem(node));
  }

  // 批量添加节点
  bulkInsert(nodes: NodeBounds[]) {
    this.tree.load(nodes.map((n) => this.toItem(n)));
  }

  // 删除节点
  remove(node: NodeBounds) {
    const item = this.toItem(node);
    this.tree.remove(item, (a, b) => a.id === b.id);
  }

  // 更新节点（先删除再插入）
  update(node: NodeBounds) {
    this.remove(node);
    this.insert(node);
  }

  // 查询某个节点是否与其他节点碰撞（部分相交）
  search(node: NodeBounds): NodeBounds[] {
    const item = this.toItem(node);
    const results = this.tree.search(item);
    // 排除自己
    return results.filter((r) => r.id !== node.id).map((r) => r.data);
  }

  // 查询某个范围内所有节点
  searchByBounds(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): NodeBounds[] {
    const searchRect = {
      minX: bounds.x,
      minY: bounds.y,
      maxX: bounds.x + bounds.width,
      maxY: bounds.y + bounds.height,
    };
    return this.tree.search(searchRect).map((r) => r.data);
  }

  // 清空
  clear() {
    this.tree.clear();
  }

  // 获取所有节点
  all(): NodeBounds[] {
    return this.tree.all().map((r) => r.data);
  }
  /** 批量插入或更新 */
  bulkInsertOrUpdate(nodes: NodeBounds[]) {
    for (const node of nodes) {
      const item = this.toItem(node);
      const existing = this.tree.search(item).find((n) => n.id === node.id);
      if (existing) {
        this.tree.remove(existing);
      }
      this.tree.insert(item);
    }
  }

  /** 单个节点插入或更新 */
  insertOrUpdate(node: NodeBounds) {
    this.bulkInsertOrUpdate([node]);
  }
}

export const collisionTree = new CollisionTree(); // 碰撞检测树
