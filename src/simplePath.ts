import * as PIXI from 'pixi.js'
import Quadtree, { Rect } from '@timohausmann/quadtree-js'

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
interface PointTreeNode extends Rect {
  point:SimpleNode
}
class SimpleLine {
  p0: PIXI.Point;
  p1: PIXI.Point;
  aabbMax: PIXI.Point = new PIXI.Point();
  aabbMin: PIXI.Point = new PIXI.Point();
  constructor (p0: PIXI.Point, p1: PIXI.Point) {
    this.p0 = p0
    this.p1 = p1
    this.aabbMax.x = Math.max(p0.x, p1.x)
    this.aabbMax.y = Math.max(p0.y, p1.y)
    this.aabbMin.x = Math.min(p0.x, p1.x)
    this.aabbMin.y = Math.min(p0.y, p1.y)
  }

  intersect (line :SimpleLine, point:PIXI.Point) {
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
interface LineTreeNode extends Rect {
  line:SimpleLine
}
class SimplePath {
    head:SimpleNode;
    points:SimpleNode[];
    paint:PIXI.Graphics;
    isClosed:boolean;
    lines:SimpleLine[];
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

    addNewPoint (graphics:PIXI.Graphics, owner:Map<SimpleNode, SimplePath>, mapping:Map<PIXI.Graphics, SimpleNode>, parent:SimpleNode, pointTree:Quadtree, lineTree:Quadtree) {
      const node = new SimpleNode(graphics)
      mapping.set(graphics, node)
      const currIdx = this.points.push(node)
      node.idx = currIdx
      owner.set(node, this)
      parent.insert(node)
      const pointTreeNode:PointTreeNode = { x: node.data.x, y: node.data.y, width: 1, height: 1, point: node }
      pointTree.insert(pointTreeNode)
      // Calulate AABB
      this.aabbMax.x = Math.max(this.aabbMax.x, graphics.x)
      this.aabbMax.y = Math.max(this.aabbMax.x, graphics.y)
      this.aabbMin.x = Math.min(this.aabbMin.x, graphics.x)
      this.aabbMin.y = Math.min(this.aabbMin.x, graphics.y)
      //
      const line = new SimpleLine(new PIXI.Point(parent.data.x, parent.data.y), (new PIXI.Point(graphics.x, graphics.y)))
      this.lines.push(line)
      const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
      lineTree.insert(lineTreeNode)
      //
      this.sum += (graphics.x - parent.data.x) * (graphics.y + parent.data.y)
    }

    drawLines () {
      this.paint.clear()
      this.paint.lineStyle(2, 0xFEEB77, 1)
      this.lines.forEach((line) => {
        this.paint.moveTo(line.p0.x, line.p0.y)
        this.paint.lineTo(line.p1.x, line.p1.y)
      /* AABB for Debug
        this.paint.beginFill(0xFEEB77, 0.2)
        this.paint.drawRect(line.aabbMin.x, line.aabbMin.y, line.aabbMax.x - line.aabbMin.x, line.aabbMax.y - line.aabbMin.y)
        this.paint.endFill()
        */
      })
    }
}
export {
  SimplePath,
  SimpleNode,
  SimpleLine
}
