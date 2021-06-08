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
  intersectedLine: Map<SimpleLine, PIXI.Point> = new Map<SimpleLine, PIXI.Point>()
  constructor (p0: PIXI.Point, p1: PIXI.Point) {
    this.p0 = p0
    this.p1 = p1
    this.aabbMax.x = Math.max(p0.x, p1.x)
    this.aabbMax.y = Math.max(p0.y, p1.y)
    this.aabbMin.x = Math.min(p0.x, p1.x)
    this.aabbMin.y = Math.min(p0.y, p1.y)
  }

  intersect (line :SimpleLine) {
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
      const point = new PIXI.Point(this.p0.x + (t * s1X), this.p0.y + (t * s1Y))
      this.intersectedLine.set(line, point)
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
    tail:SimpleNode;
    count = 0
    points:SimpleNode[];
    paint:PIXI.Graphics;
    lines:SimpleLine[];
    mapping:Map<SimpleNode, SimpleLine> = new Map<SimpleNode, SimpleLine>();
    aabbMax: PIXI.Point = new PIXI.Point();
    aabbMin:PIXI.Point = new PIXI.Point();
    sum:number = 0;
    constructor (head:SimpleNode, paint:PIXI.Graphics) {
      this.head = head
      this.tail = head
      this.points = []
      this.lines = []
      this.points.push(head)
      this.paint = paint
      this.count = 1
      this.aabbMax.x = head.data.x
      this.aabbMax.y = head.data.y
      this.aabbMin.x = head.data.x
      this.aabbMin.y = head.data.y
    }

    addNewPoint (graphics:PIXI.Graphics, pointTree: Quadtree, lineTree: Quadtree) {
      this.count += 1
      const node = new SimpleNode(graphics)
      const currIdx = this.points.push(node)
      node.idx = currIdx
      // Insert into my data structure
      this.tail.insert(node)
      this.tail = this.tail.next
      // Insert into quadtree
      const pointTreeNode:PointTreeNode = { x: node.data.x, y: node.data.y, width: 1, height: 1, point: node }
      pointTree.insert(pointTreeNode)
      // Calulate AABB
      this.aabbMax.x = Math.max(this.aabbMax.x, graphics.x)
      this.aabbMax.y = Math.max(this.aabbMax.x, graphics.y)
      this.aabbMin.x = Math.min(this.aabbMin.x, graphics.x)
      this.aabbMin.y = Math.min(this.aabbMin.x, graphics.y)
      // Create segment
      const line = new SimpleLine(new PIXI.Point(this.tail.data.x, this.tail.data.y), (new PIXI.Point(graphics.x, graphics.y)))
      this.lines.push(line)
      this.mapping.set(node, line)
      this.mapping.set(node.prev, line)
      // Insert line into quadtree
      const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
      lineTree.insert(lineTreeNode)
      // Calulate signed area
      this.sum += (graphics.x - this.tail.data.x) * (graphics.y + this.tail.data.y)
      // Draw Lines
      this.drawLines()
      return node
    }

    /**
     * Check specified line whether intersecting with another lines (Wrose case : O(n^2))
     * @param modifiedLines The line has been modified
     * @todo Use sweep line when the number of input is greather than log(n)
     */
    checkLines (modifiedLines:SimpleLine[]) {
      modifiedLines.forEach((elem) => {
        elem.intersectedLine.clear()
        this.lines.forEach((another) => {
          if (another !== elem) {
            elem.intersect(another)
          }
        })
      })
    }

    closePath (lineTree: Quadtree) {
      this.tail.insert(this.head)
      this.tail = this.head
      const line = new SimpleLine(new PIXI.Point(this.tail.data.x, this.tail.data.y), (new PIXI.Point(this.tail.data.x, this.tail.data.y)))
      this.lines.push(line)
      const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
      lineTree.insert(lineTreeNode)
      this.drawLines()
    }

    insertDataIntoTree (pointTree: Quadtree, lineTree: Quadtree) {
      this.points.forEach((node) => {
        const pointTreeNode:PointTreeNode = { x: node.data.x, y: node.data.y, width: 1, height: 1, point: node }
        pointTree.insert(pointTreeNode)
      })
      this.lines.forEach((line) => {
        const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
        lineTree.insert(lineTreeNode)
      })
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
