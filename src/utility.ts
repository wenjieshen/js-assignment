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
  path.points.forEach((point) => {
    context.app!.stage.removeChild(point.data)
    context.mapping.delete(point.data)
    context.owner.delete(point)
  })
  context.pointTree!.clear()
  context.lineTree!.clear()
  context.path.forEach((elem) => {
    elem.insertDataIntoTree(context.pointTree!, context.lineTree!)
  })
}
export {
  DrawHoledPoint,
  DrawSolidPoint,
  BeforeDeletePath
}
