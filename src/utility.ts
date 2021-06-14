import { Context } from './context'
import { SimplePath } from './simplePath'

export const DeletePath = function (context:Context, path:SimplePath) {
  context.app!.stage.removeChild(path.paint)
  path.nodes.forEach((node) => {
    const headEntity = context.map2PIXI.get(node)!
    context.app!.stage.removeChild(headEntity)
    context.map2PIXI.delete(node)
    context.map2Node.delete(headEntity)
    context.owner.delete(node)
  })
  const idx = context.paths.indexOf(path)
  context.paths.splice(idx)
  context.pointTree!.clear()
  context.paths.forEach((elem) => {
    elem.nodes.forEach((node) => {
      context.pointTree!.insert({ x: node.data.x, y: node.data.y, width: context.setting.pointSize, height: context.setting.pointSize })
    })
  })
}
