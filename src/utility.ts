import * as PIXI from 'pixi.js'
import { SimplePath, SimpleNode } from './stateControl'
const DrawHoledPoint = function (graphics:PIXI.Graphics) {
  graphics.clear()
  graphics.lineStyle(1)
  graphics.beginFill(0xFFFFFF, 0.1)
  graphics.drawCircle(0, 0, 5)
  graphics.endFill()
  // graphics.cacheAsBitmap = true
}
const DrawSolidPoint = function (graphics:PIXI.Graphics) {
  graphics.clear()
  graphics.lineStyle(0)
  graphics.beginFill(0xF4D03F, 1)
  graphics.drawCircle(0, 0, 5)
  graphics.endFill()
  // graphics.cacheAsBitmap = true
}
const AddNewGraph = function (graphics:PIXI.Graphics, container:PIXI.Container, owner:Map<SimpleNode, SimplePath>, mapping:Map<PIXI.Graphics, SimpleNode>) {
  const head = new SimpleNode(graphics)
  mapping.set(graphics, head)
  const graph = new SimplePath(head, container.addChild(new PIXI.Graphics()))
  owner.set(head, graph)
  graph.aabbMax.x = head.data.x
  graph.aabbMin.x = head.data.x
  graph.aabbMax.y = head.data.y
  graph.aabbMin.y = head.data.y
  return graph
}

export {
  DrawHoledPoint,
  DrawSolidPoint,
  AddNewGraph
}
