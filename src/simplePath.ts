import * as PIXI from 'pixi.js'
import Quadtree, { Rect } from '@timohausmann/quadtree-js'

class SimpleNode {
    idx:number
    data:PIXI.Point;
    next:SimpleNode
    prev:SimpleNode
    nextVertex:SimpleNode
    prevVertex:SimpleNode
    isVertex:boolean = false
    isEntry:boolean = false
    constructor (data:PIXI.Point, idx:number) {
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

class SimplePath {
    head:SimpleNode;
    tail:SimpleNode;
    count = 0
    nodes:SimpleNode[];
    paint:PIXI.Graphics;
    lines:SimpleLine[];
    aabbMax: PIXI.Point = new PIXI.Point();
    aabbMin:PIXI.Point = new PIXI.Point();
    sum:number = 0;
    intersectedVertices:SimpleNode[] = []
    vertexPair:Map<SimpleNode, SimpleNode> = new Map<SimpleNode, SimpleNode>()
    constructor (head:SimpleNode, paint:PIXI.Graphics) {
      this.head = head
      this.tail = head
      this.nodes = []
      this.lines = []
      this.nodes.push(head)
      this.paint = paint
      this.count = 1
      this.aabbMax.x = head.data.x
      this.aabbMax.y = head.data.y
      this.aabbMin.x = head.data.x
      this.aabbMin.y = head.data.y
    }

    addNewPoint (coord:PIXI.Point, pointTree: Quadtree) {
      const node = new SimpleNode(coord, this.count)
      // Insert into my data structure
      this.nodes.push(node)
      this.tail.insert(node)
      this.tail = this.tail.next
      // Insert into quadtree
      const pointTreeNode:PointTreeNode = { x: node.data.x, y: node.data.y, width: 1, height: 1, point: node }
      pointTree.insert(pointTreeNode)
      // Calulate AABB
      this.aabbMax.x = Math.max(this.aabbMax.x, coord.x)
      this.aabbMax.y = Math.max(this.aabbMax.x, coord.y)
      this.aabbMin.x = Math.min(this.aabbMin.x, coord.x)
      this.aabbMin.y = Math.min(this.aabbMin.x, coord.y)
      // Create segment
      const line = new SimpleLine(node.prev, node)
      this.addLines([line])
      // Calulate signed area
      this.sum += (coord.x - this.tail.data.x) * (coord.y + this.tail.data.y)
      // Draw Lines
      this.drawLines()
      //
      this.count++
      return node
    }

    /**
     * Add specified line whether intersecting with another lines (Wrose case : O(n^2))
     * @param modifiedLines The line has been modified
     * @todo Use sweep line when the number of input is greather than log(n)
     */
    addLines (modifiedLines:SimpleLine[]) {
      const point = new PIXI.Point()
      const makeLines = function (p0: SimpleNode, p1: SimpleNode, v: SimpleNode, arr: SimpleLine[]) {
        p0.insertVertex(v)
        arr.push(new SimpleLine(p0, v))
        arr.push(new SimpleLine(v, p1))
      }
      modifiedLines.forEach((elem) => {
        const existLines:Set<SimpleLine> = new Set<SimpleLine>(this.lines)
        const currLines:SimpleLine[] = []
        let intersecting = false
        this.lines.forEach((another) => {
          if (another === elem || elem.p0 === another.p1 || elem.p1 === another.p0) {
            return
          }
          if (!elem.intersect(another, point)) {
            return
          }
          intersecting = true
          existLines.delete(another)
          const vertex0 = new SimpleNode(new PIXI.Point(point.x, point.y), -1)
          vertex0.isVertex = true
          const vertex1 = new SimpleNode(new PIXI.Point(point.x, point.y), -1)
          vertex1.isVertex = true
          // Make pair
          this.vertexPair.set(vertex0, vertex1)
          this.vertexPair.set(vertex1, vertex0)
          // Vertices
          makeLines(elem.p0, elem.p1, vertex0, currLines)
          makeLines(another.p0, another.p1, vertex1, currLines)
          //
          vertex0.idx = this.intersectedVertices.push(vertex0)
          vertex1.idx = this.intersectedVertices.push(vertex1)
        })
        if (!intersecting) {
          currLines.push(elem)
        }
        this.lines = Array.from(existLines)
        currLines.forEach(obj => this.lines.push(obj))
      })
    }

    closePath () {
      const line = new SimpleLine(this.tail, this.tail.next)
      this.addLines([line])
      this.drawFill()
    }

    insertDataIntoTree (pointTree: Quadtree) {
      this.nodes.forEach((node) => {
        const pointTreeNode:PointTreeNode = { x: node.data.x, y: node.data.y, width: 1, height: 1, point: node }
        pointTree.insert(pointTreeNode)
      })
    }

    setStatus () {
      const stop = this.head
      let curr = stop
      let isEntry = false
      do {
        if (curr.isVertex) {
          curr.isEntry = !isEntry
          isEntry = !isEntry
        }
        curr = curr.nextVertex
      } while (stop !== curr)
    }

    VisitIntersection (startPathCB:()=>void, coordCB:(x:number, y:number)=>void, closePathCB:()=>void, forward:boolean) {
      this.setStatus()
      const seen = new Set<SimpleNode>()
      this.intersectedVertices.forEach((vertex) => {
        if (seen.has(vertex)) return
        const stop = vertex
        let head = vertex
        startPathCB()
        do {
          if (head.isEntry === forward) {
            do {
              seen.add(head)
              coordCB(head.data.x, head.data.y)
              head = head.prevVertex
            } while (!head.isVertex)
          } else {
            do {
              seen.add(head)
              coordCB(head.data.x, head.data.y)
              head = head.nextVertex
            } while (!head.isVertex)
          }
          head = this.vertexPair.get(head)!
        } while (head !== stop)
        closePathCB()
      })
    }

    drawXOR () {
      this.paint.lineStyle(5, 0x77EB77)
      this.paint.beginFill(0xFEEB77, 0.3)
      let polygon:number[] = []
      this.VisitIntersection(() => { polygon = [] }, (x, y) => { polygon.push(x, y) }, () => { this.paint.drawPolygon(polygon); this.paint.closePath() }, true)
      this.paint.endFill()
      this.paint.beginFill(0xEB77FE, 0.3)
      this.VisitIntersection(() => { polygon = [] }, (x, y) => { polygon.push(x, y) }, () => { this.paint.drawPolygon(polygon); this.paint.closePath() }, false)
      this.paint.endFill()
    }

    drawNonIntersection () {
      const drawPath = []
      const stop = this.head
      let head = this.head
      do {
        drawPath.push(head.data.x)
        drawPath.push(head.data.y)
        head = head.next
      } while (head !== stop)
      this.paint.lineStyle(5, 0x77EB77)
      this.paint.beginFill(0xFEEB77, 0.8)
      this.paint.drawPolygon(drawPath)
      this.paint.closePath()
      this.paint.endFill()
    }

    drawFill () {
      this.paint.cacheAsBitmap = false
      this.paint.clear()
      if (this.intersectedVertices.length !== 0) {
        this.drawXOR()
      } else {
        this.drawNonIntersection()
      }
      this.paint.cacheAsBitmap = true
    }

    drawLines () {
      this.paint.clear()
      this.paint.lineStyle(2, 0xFEEB77, 1)
      this.lines.forEach((line) => {
        this.paint.moveTo(line.p0.data.x, line.p0.data.y)
        this.paint.lineTo(line.p1.data.x, line.p1.data.y)
      })
    }
}
export {
  SimplePath,
  SimpleNode,
  SimpleLine
}
