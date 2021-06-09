import * as PIXI from 'pixi.js'
import { Context } from './context'
import { SimplePath } from './simplePath'
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
const BeforeDeletePath = function (context:Context, path:SimplePath) {
  context.app!.stage.removeChild(path.paint)
  path.nodes.forEach((node) => {
    const headEntity = context.connection.get(node)!
    context.app!.stage.removeChild(headEntity)
    context.connection.delete(node)
    context.mapping.delete(headEntity)
    context.owner.delete(node)
  })
  context.pointTree!.clear()
  context.path.forEach((elem) => {
    elem.insertDataIntoTree(context.pointTree!)
  })
}
export {
  DrawHoledPoint,
  DrawSolidPoint,
  BeforeDeletePath
}
