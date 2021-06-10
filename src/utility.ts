import { Context } from './context'
import { SimplePath } from './simplePath'

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
  BeforeDeletePath
}
