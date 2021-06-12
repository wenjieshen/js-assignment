import { Context } from './context'
import { SimplePath } from './simplePath'

export const BeforeDeletePath = function (context:Context, path:SimplePath) {
  context.app!.stage.removeChild(path.paint)
  path.nodes.forEach((node) => {
    const headEntity = context.map2PIXI.get(node)!
    context.app!.stage.removeChild(headEntity)
    context.map2PIXI.delete(node)
    context.map2Node.delete(headEntity)
    context.owner.delete(node)
  })
  context.pointTree!.clear()
  context.paths.forEach((elem) => {
    elem.insertDataIntoTree(context.pointTree!)
  })
}
