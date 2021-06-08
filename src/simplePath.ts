import * as PIXI from 'pixi.js'
import Quadtree, { Rect } from '@timohausmann/quadtree-js'

class SimpleNode {
    idx:number
    data:PIXI.Graphics;
    next:SimpleNode
    prev:SimpleNode
    nextVertex:SimpleNode
    prevVertex:SimpleNode
    constructor (data:PIXI.Graphics, idx:number) {
      this.data = data
      this.next = this
      this.prev = this
      this.nextVertex = this
      this.prevVertex = this
      this.idx = idx
    }

    insert (node:SimpleNode) {
      node.next = this.next
      node.prev = this
      this.next.prev = node
      this.next = node
      this.insertVertex(node)
    }

    insertVertex (node:SimpleNode) {
      node.nextVertex = this.nextVertex
      node.prevVertex = this
      this.nextVertex.prevVertex = node
      this.nextVertex = node
    }
}
interface PointTreeNode extends Rect {
  point:SimpleNode
}
class SimpleLine {
  p0: SimpleNode;
  p1: SimpleNode;
  aabbMax: PIXI.Point = new PIXI.Point();
  aabbMin: PIXI.Point = new PIXI.Point();
  intersection = new Map<SimpleLine, SimpleNode>()
  constructor (p0: SimpleNode, p1: SimpleNode) {
    this.p0 = p0
    this.p1 = p1
    this.aabbMax.x = Math.max(p0.data.x, p1.data.x)
    this.aabbMax.y = Math.max(p0.data.y, p1.data.y)
    this.aabbMin.x = Math.min(p0.data.x, p1.data.x)
    this.aabbMin.y = Math.min(p0.data.y, p1.data.y)
  }

  intersect (line :SimpleLine, point: PIXI.Point) {
    // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
    const p2 = line.p0.data; const p3 = line.p1.data
    //
    const s1X = this.p1.data.x - this.p0.data.x
    const s1Y = this.p1.data.y - this.p0.data.y
    const s2X = p3.x - p2.x
    const s2Y = p3.y - p2.y
    //
    const inv = 1.0 / (-s2X * s1Y + s1X * s2Y)
    const s = (-s1Y * (this.p0.data.x - p2.x) + s1X * (this.p0.data.y - p2.y)) * inv
    const t = (s2X * (this.p0.data.y - p2.y) - s2Y * (this.p0.data.x - p2.x)) * inv

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      // Collision detected
      // point = new PIXI.Point(this.p0.data.x + (t * s1X), this.p0.data.y + (t * s1Y))
      point.x = this.p0.data.x + (t * s1X)
      point.y = this.p0.data.y + (t * s1Y)
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
    aabbMax: PIXI.Point = new PIXI.Point();
    aabbMin:PIXI.Point = new PIXI.Point();
    sum:number = 0;
    intersectedVertices:SimpleNode[] = []
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
      const node = new SimpleNode(graphics, this.count)
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
      const line = new SimpleLine(node.prev, node)
      this.lines.push(line)
      this.checkLines([line])
      // Insert line into quadtree
      const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
      lineTree.insert(lineTreeNode)
      // Calulate signed area
      this.sum += (graphics.x - this.tail.data.x) * (graphics.y + this.tail.data.y)
      // Draw Lines
      this.drawLines()
      //
      this.count++
      return node
    }

    /**
     * Check specified line whether intersecting with another lines (Wrose case : O(n^2))
     * @param modifiedLines The line has been modified
     * @todo Use sweep line when the number of input is greather than log(n)
     */
    checkLines (modifiedLines:SimpleLine[]) {
      const point = new PIXI.Point()
      modifiedLines.forEach((elem) => {
        this.lines.forEach((another) => {
          if (another !== elem && elem.p0 !== another.p1 && elem.p1 !== another.p0) {
            if (elem.intersect(another, point)) {
              const data0 = new PIXI.Graphics()
              const data1 = new PIXI.Graphics()
              data0.x = point.x
              data0.y = point.y
              data1.x = point.x
              data1.y = point.y
              const vertex0 = new SimpleNode(data0, -1)
              const vertex1 = new SimpleNode(data1, -1)
              //
              elem.p0.insert(vertex0)
              vertex0.nextVertex = another.p1
              vertex0.nextVertex.prevVertex = vertex0
              another.p0.insert(vertex1)
              vertex1.nextVertex = elem.p1
              vertex1.nextVertex.prevVertex = vertex1
              //
              vertex0.idx = -this.intersectedVertices.push(vertex0)
              vertex1.idx = -this.intersectedVertices.push(vertex1)
            } else if (elem.intersection.has(another)) { // No longer to intersecting
              const v0 = elem.intersection.get(another)!
              v0.prevVertex = v0.prevVertex.prevVertex
              v0.nextVertex = v0.nextVertex.nextVertex
              this.intersectedVertices.splice(-v0.idx)
              // I want to delete the vertex but Lint warns me don't do it
              const v1 = another.intersection.get(elem)!
              v1.prevVertex = v1.prevVertex.prevVertex
              v1.nextVertex = v1.nextVertex.nextVertex
              this.intersectedVertices.splice(-v1.idx)
            }
          }
        })
      })
    }

    closePath (lineTree: Quadtree) {
      const line = new SimpleLine(this.tail, this.tail.next)
      this.lines.push(line)
      const lineTreeNode:LineTreeNode = { x: line.aabbMin.x, y: line.aabbMin.y, width: (line.aabbMax.x - line.aabbMin.x), height: (line.aabbMax.y - line.aabbMin.y), line: line }
      lineTree.insert(lineTreeNode)
      this.checkLines([line])
      this.drawFill()
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

    drawFill () {
      this.paint.clear()
      /* Debugging
      this.intersectedVertices.forEach((vertex) => {
        this.paint.beginFill(0xFEEB77, 0.2)
        this.paint.drawRect(vertex.data.x, vertex.data.y, 10, 10)
        this.paint.endFill()
      }) */

      let polygons = [this.head]
      if (this.intersectedVertices.length !== 0) {
        polygons = this.intersectedVertices
      }
      polygons.forEach((vertex) => {
        const stop = vertex
        let head = vertex
        const drawPath = []
        do {
          drawPath.push(head.data.x)
          drawPath.push(head.data.y)
          head = head.nextVertex
        } while (head !== stop)
        this.paint.beginFill(0xFEEB77, 0.8)
        this.paint.drawPolygon(drawPath)
        this.paint.closePath()
        this.paint.endFill()
      })
    }

    drawLines () {
      this.paint.clear()
      this.paint.lineStyle(2, 0xFEEB77, 1)
      this.lines.forEach((line) => {
        this.paint.moveTo(line.p0.data.x, line.p0.data.y)
        this.paint.lineTo(line.p1.data.x, line.p1.data.y)
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
