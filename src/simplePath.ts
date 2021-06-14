import * as PIXI from 'pixi.js'

class SimpleNode {
    data:PIXI.Point;
    next:SimpleNode
    prev:SimpleNode
    nextVertex:SimpleNode
    prevVertex:SimpleNode
    isVertex:boolean = false
    isEntry:boolean = false
    key?:number
    constructor (data:PIXI.Point) {
      this.data = data
      this.next = this
      this.prev = this
      this.nextVertex = this
      this.prevVertex = this
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
export interface PathViewSetting{
  pointSize: number
  pointColor: number
  pointAlpha: number
  lineWidth: number
  lineColor: number
  lineAlpha: number
  fillColor: number
  backColor: number
  fillAlpha: number
}
class SimplePath {
    head:SimpleNode;
    tail:SimpleNode;
    count = 1 // There should be always a point here
    vertexKey = 0
    nodes = new Set<SimpleNode>();
    paint:PIXI.Graphics;
    lines:Set<SimpleLine> = new Set<SimpleLine>();
    aabbMax: PIXI.Point = new PIXI.Point();
    aabbMin:PIXI.Point = new PIXI.Point();
    sum:number = 0;
    intersectedVertices = new Map<number, SimpleNode>()
    vertexPair:Map<SimpleNode, SimpleNode> = new Map<SimpleNode, SimpleNode>()
    viewSetting:PathViewSetting
    isClosed = false
    constructor (head:SimpleNode, paint:PIXI.Graphics, viewSetting:PathViewSetting) {
      this.head = head
      this.tail = head
      this.nodes.add(head)
      this.paint = paint
      this.aabbMax.x = head.data.x
      this.aabbMax.y = head.data.y
      this.aabbMin.x = head.data.x
      this.aabbMin.y = head.data.y
      this.viewSetting = viewSetting
      this.drawLines()
    }

    addNewPoint (coord:PIXI.Point) {
      const node = new SimpleNode(coord)
      // Insert into my data structure
      this.nodes.add(node)
      this.tail.insert(node)
      this.tail = this.tail.next
      // Calulate AABB
      this.aabbMax.x = Math.max(this.aabbMax.x, coord.x); this.aabbMax.y = Math.max(this.aabbMax.x, coord.y)
      this.aabbMin.x = Math.min(this.aabbMin.x, coord.x); this.aabbMin.y = Math.min(this.aabbMin.x, coord.y)
      // Create segment
      this.addLines(new SimpleLine(node.prev, node))
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
    addLines (modifiedLine:SimpleLine) {
      const point = new PIXI.Point()
      /** @todo Is it a inline function? */
      const makeLines = function (p0: SimpleNode, p1: SimpleNode, v: SimpleNode, arr: SimpleLine[]) {
        p0.insertVertex(v)
        const l0 = new SimpleLine(p0, v)
        const l1 = new SimpleLine(v, p1)
        arr.push(l0)
        arr.push(l1)
      }

      const remainedLines:Set<SimpleLine> = new Set<SimpleLine>(this.lines)
      const currLines:SimpleLine[] = []
      let intersecting = false
      this.lines.forEach((another) => {
        if (another === modifiedLine || modifiedLine.p0 === another.p1 || modifiedLine.p1 === another.p0) return
        if (!modifiedLine.intersect(another, point)) return
        // Insert interasection vertex
        intersecting = true
        remainedLines.delete(another)
        const vertex0 = new SimpleNode(new PIXI.Point(point.x, point.y))
        vertex0.isVertex = true
        const vertex1 = new SimpleNode(new PIXI.Point(point.x, point.y))
        vertex1.isVertex = true
        // Make pair
        this.vertexPair.set(vertex0, vertex1)
        this.vertexPair.set(vertex1, vertex0)
        // Vertices
        makeLines(modifiedLine.p0, modifiedLine.p1, vertex0, currLines)
        makeLines(another.p0, another.p1, vertex1, currLines)
        //
        vertex0.key = vertex1.key = this.vertexKey
        this.intersectedVertices.set(this.vertexKey++, vertex0)
      })
      if (!intersecting) {
        currLines.push(modifiedLine)
      }
      this.lines = remainedLines
      currLines.forEach(obj => this.lines.add(obj))
    }

    closePath () {
      this.isClosed = true
      const currLine = new SimpleLine(this.tail, this.tail.next)
      this.addLines(currLine)
      this.drawFill()
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
      const seen = new Set<number>()
      this.intersectedVertices.forEach((vertex) => {
        if (seen.has(vertex.key!)) return
        const stop = vertex
        let head = vertex
        startPathCB()
        do {
          seen.add(head.key!)
          if (head.isEntry === forward) {
            do {
              coordCB(head.data.x, head.data.y)
              head = head.prevVertex
            } while (!head.isVertex)
          } else {
            do {
              coordCB(head.data.x, head.data.y)
              head = head.nextVertex
            } while (!head.isVertex)
          }
          head = this.vertexPair.get(head)!
        } while (head !== stop)
        closePathCB()
      })
    }

    drawUnion () {
      this.paint.lineStyle(this.viewSetting.lineWidth, this.viewSetting.lineColor, this.viewSetting.lineAlpha)
      this.paint.beginFill(this.viewSetting.fillColor, this.viewSetting.fillAlpha)
      let polygon:number[] = [] // Triangluaration by engine
      this.VisitIntersection(() => { polygon = [] }, (x, y) => { polygon.push(x, y) }, () => { this.paint.drawPolygon(polygon); this.paint.closePath() }, true)
      this.paint.endFill()
      this.paint.beginFill(this.viewSetting.backColor, this.viewSetting.fillAlpha)
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
      this.paint.lineStyle(this.viewSetting.lineWidth, this.viewSetting.lineColor, this.viewSetting.lineAlpha)
      this.paint.beginFill(this.viewSetting.fillColor, this.viewSetting.fillAlpha)
      this.paint.drawPolygon(drawPath)
      this.paint.closePath()
      this.paint.endFill()
    }

    drawFill () {
      this.paint.clear()
      if (this.intersectedVertices.size !== 0) {
        this.drawUnion()
      } else {
        this.drawNonIntersection()
      }
      this.drawPoints()
    }

    drawLines () {
      this.paint.clear()
      this.paint.lineStyle(this.viewSetting.lineWidth, this.viewSetting.lineColor, this.viewSetting.lineAlpha)
      this.lines.forEach((line) => {
        this.paint.moveTo(line.p0.data.x, line.p0.data.y)
        this.paint.lineTo(line.p1.data.x, line.p1.data.y)
      })
      this.drawPoints()
    }

    drawPoints () {
      this.paint.beginFill(this.viewSetting.pointColor, this.viewSetting.pointAlpha)
      this.nodes.forEach((node) => {
        this.paint.drawCircle(node.data.x, node.data.y, this.viewSetting.pointSize)
      })
      this.paint.endFill()
    }

    removeIntersections (start: SimpleNode, end: SimpleNode, forward:boolean) {
      let curr = start
      const isec = []
      do {
        if (curr.isVertex) isec.push(curr)
        curr = forward ? curr.nextVertex : curr.prevVertex
      } while (curr !== end)
      isec.forEach(element => {
        const neighbor = this.vertexPair.get(element)!
        neighbor.prevVertex.nextVertex = neighbor.nextVertex
        neighbor.nextVertex.prevVertex = neighbor.prevVertex
        this.vertexPair.delete(neighbor)
        element.prevVertex.nextVertex = element.nextVertex
        element.nextVertex.prevVertex = element.prevVertex
        this.vertexPair.delete(element)
        this.intersectedVertices.delete(element.key!)
      })
    }

    rebuildLine (head:SimpleNode, forward:boolean) {
      this.removeIntersections(head, forward ? head.next : head.prev, forward)
      let curr = head
      this.lines.clear()
      if (forward) {
        do {
          this.lines.add(new SimpleLine(curr.prevVertex, curr))
          curr = curr.prevVertex
        } while (curr !== head.next)
      } else {
        do {
          this.lines.add(new SimpleLine(curr, curr.nextVertex))
          curr = curr.prevVertex
        } while (curr !== head.next)
      }
    }

    movePoint (modifiedNode:SimpleNode, dir:PIXI.Point) {
      modifiedNode.data.x += dir.x
      modifiedNode.data.y += dir.y
      this.rebuildLine(modifiedNode, true)
      this.addLines(new SimpleLine(modifiedNode, modifiedNode.next))
      this.rebuildLine(modifiedNode, false)
      this.addLines(new SimpleLine(modifiedNode.prev, modifiedNode))
    }

    refreshOpenPath () {
      let curr = this.head
      this.lines.clear()
      while (curr !== this.tail) {
        this.lines.add(new SimpleLine(curr, curr.nextVertex))
        curr = curr.nextVertex
      }
    }

    deletePtFromClosed (deletedNode:SimpleNode) {
      this.removeIntersections(deletedNode.prev, deletedNode.next, true)
      this.tail = deletedNode.prev
      this.head = deletedNode.next
      this.tail.next = this.head
      this.head.prev = this.tail
      this.tail.nextVertex = this.head
      this.head.prevVertex = this.tail
      this.refreshOpenPath()
      this.nodes.delete(deletedNode)
      this.isClosed = false
    }

    deletePtFromOpened (deletedNode:SimpleNode) {
      if (this.head === deletedNode) {
        this.removeIntersections(deletedNode, deletedNode.next, true)
        this.head = this.head.next
        this.tail.next = this.head
        this.head.prev = this.tail
        this.tail.nextVertex = this.head
        this.head.prevVertex = this.tail
      } else if (this.tail === deletedNode) {
        this.removeIntersections(deletedNode, deletedNode.prev, false)
        this.tail = this.tail.prev
        this.tail.next = this.head
        this.head.prev = this.tail
        this.tail.nextVertex = this.head
        this.head.prevVertex = this.tail
      } else {
        this.removeIntersections(deletedNode.prev, deletedNode.next, true)
        deletedNode.prev.next = deletedNode.next
        deletedNode.next.prev = deletedNode.prev
        deletedNode.prev.nextVertex = deletedNode.nextVertex
        deletedNode.next.prevVertex = deletedNode.prevVertex
      }
      this.refreshOpenPath()
      this.nodes.delete(deletedNode)
    }

    deletePoint (deletedNode:SimpleNode) {
      if (this.isClosed) {
        this.deletePtFromClosed(deletedNode)
      } else {
        this.deletePtFromOpened(deletedNode)
      }
    }
}
export {
  SimplePath,
  SimpleNode,
  SimpleLine
}
