import * as PIXI from 'pixi.js'

class SimpleNode {
    idx?:number
    data:PIXI.Graphics;
    next:SimpleNode
    prev:SimpleNode
    constructor (data:PIXI.Graphics) {
      this.data = data
      this.next = this
      this.prev = this
    }

    insert (node:SimpleNode) {
      node.next = this.next
      node.prev = this
      this.next.prev = node
      this.next = node
    }
}
class Line {
  p0: PIXI.Point;
  p1: PIXI.Point;
  aabbMax: PIXI.Point = new PIXI.Point();
  aabbMin: PIXI.Point = new PIXI.Point();
  constructor (p0: PIXI.Point, p1: PIXI.Point) {
    this.p0 = p0
    this.p1 = p1
    this.aabbMax.x = Math.max(p0.x, p1.x)
    this.aabbMax.y = Math.max(p0.x, p1.y)
    this.aabbMin.x = Math.min(p0.x, p1.x)
    this.aabbMin.y = Math.min(p0.x, p1.y)
  }

  intersect (line :Line, point:PIXI.Point) {
    // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
    const p2 = line.p0; const p3 = line.p1
    //
    const s1X = this.p1.x - this.p0.x
    const s1Y = this.p1.y - this.p0.y
    const s2X = p3.x - p2.x
    const s2Y = p3.y - p2.y
    //
    const inv = 1.0 / (-s2X * s1Y + s1X * s2Y)
    const s = (-s1Y * (this.p0.x - p2.x) + s1X * (this.p0.y - p2.y)) * inv
    const t = (s2X * (this.p0.y - p2.y) - s2Y * (this.p0.x - p2.x)) * inv

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      // Collision detected
      point.x = this.p0.x + (t * s1X)
      point.y = this.p0.y + (t * s1Y)
      return true
    }

    return false// No collision
  }
}
class KDTreeNode {
  line:Line
  aabbMax:PIXI.Point = new PIXI.Point()
  aabbMin:PIXI.Point = new PIXI.Point()
  left:KDTreeNode|null = null
  right:KDTreeNode|null = null
  constructor (line:Line) {
    this.line = line
    this.aabbMax.x = line.aabbMax.x
    this.aabbMin.x = line.aabbMin.x
    this.aabbMax.y = line.aabbMax.y
    this.aabbMin.y = line.aabbMin.y
  }
}
class SimplePath {
    head:SimpleNode;
    points:SimpleNode[];
    paint:PIXI.Graphics;
    isClosed:boolean;
    lines:Line[];
    kdTree?:KDTreeNode;
    aabbMax: PIXI.Point = new PIXI.Point();
    aabbMin:PIXI.Point = new PIXI.Point();
    sum:number = 0;
    constructor (head:SimpleNode, paint:PIXI.Graphics) {
      this.head = head
      this.points = []
      this.lines = []
      this.points.push(head)
      this.paint = paint
      this.isClosed = false
    }

    addNewPoint (graphics:PIXI.Graphics, owner:Map<SimpleNode, SimplePath>, mapping:Map<PIXI.Graphics, SimpleNode>, parent:SimpleNode) {
      const node = new SimpleNode(graphics)
      mapping.set(graphics, node)
      const currIdx = this.points.push(node)
      node.idx = currIdx
      owner.set(node, this)
      parent.insert(node)
      this.aabbMax.x = Math.max(this.aabbMax.x, graphics.x)
      this.aabbMax.y = Math.max(this.aabbMax.x, graphics.y)
      this.aabbMin.x = Math.min(this.aabbMin.x, graphics.x)
      this.aabbMin.y = Math.min(this.aabbMin.x, graphics.y)
      this.sum += (graphics.x - parent.data.x) * (graphics.y + parent.data.y)
      const line = new Line(new PIXI.Point(parent.data.x, parent.data.y), (new PIXI.Point(graphics.x, graphics.y)))
      this.lines.push(line)
      this.drawLines()
    }

    drawLines () {
      this.paint.lineStyle(2, 0xFEEB77, 1)
      this.lines.forEach((line) => {
        this.paint.moveTo(line.p0.x, line.p0.y)
        this.paint.lineTo(line.p1.x, line.p1.y)
      })
    }

    buildKdTree () {
      const sortByX: Line[] = []
      const sortByY: Line[] = []
      this.lines.forEach((line) => {
        sortByX.push(line)
        sortByY.push(line)
      })
      sortByX.sort((a, b) => {
        const keyA = (a.aabbMax.x + a.aabbMin.x) * 0.5
        const keyB = (b.aabbMax.x + b.aabbMin.x) * 0.5
        return keyA - keyB
      })
      sortByY.sort((a, b) => {
        const keyA = (a.aabbMax.y + a.aabbMin.y) * 0.5
        const keyB = (b.aabbMax.y + b.aabbMin.y) * 0.5
        return keyA - keyB
      })
      const updateBB = function (node:KDTreeNode) {
        if (node.left === null && node.right === null) {
          return
        }
        if (node.left !== null) {
          node.aabbMax.x = Math.max(node.aabbMax.x, node.left.aabbMax.x)
          node.aabbMax.y = Math.max(node.aabbMax.y, node.left.aabbMax.y)
          node.aabbMin.x = Math.min(node.aabbMin.x, node.left.aabbMin.x)
          node.aabbMin.y = Math.min(node.aabbMin.y, node.left.aabbMin.y)
        }
        if (node.right !== null) {
          node.aabbMax.x = Math.max(node.aabbMax.x, node.right.aabbMax.x)
          node.aabbMax.y = Math.max(node.aabbMax.y, node.right.aabbMax.y)
          node.aabbMin.x = Math.min(node.aabbMin.x, node.right.aabbMin.x)
          node.aabbMin.y = Math.min(node.aabbMin.y, node.right.aabbMin.y)
        }
      }
      const buildKdTreeHelper = function (begin: number, end: number, depth: number) : KDTreeNode | null {
        if (!(end - begin > 0)) {
          return null
        }
        const mid = Math.floor((begin + end) * 0.5)
        const centerOfAxis = (depth % 2) === 0 ? (sortByX[mid]) : (sortByY[mid])
        const median = new KDTreeNode(centerOfAxis)
        median.left = buildKdTreeHelper(begin, mid, depth + 1)
        median.right = buildKdTreeHelper(mid + 1, end, depth + 1)
        updateBB(median)
        return median
      }
      this.kdTree = buildKdTreeHelper(0, this.lines.length, 0)!
      const stk:KDTreeNode[] = []
      stk.push(this.kdTree)
      this.paint.lineStyle(2, 0xFEEB77, 1)
      while (stk.length > 0) {
        const curr = stk.pop()
        this.paint.moveTo(this.aabbMin.x, this.aabbMin.y)
        this.paint.lineTo(this.aabbMax.x, this.aabbMin.y)
        this.paint.lineTo(this.aabbMax.x, this.aabbMax.y)
        this.paint.lineTo(this.aabbMin.x, this.aabbMax.y)
        this.paint.lineTo(this.aabbMin.x, this.aabbMin.y)
        if (curr!.left) stk.push(curr!.left)
        if (curr!.right) stk.push(curr!.right)
      }
    }
}
export {
  SimplePath,
  SimpleNode
}
