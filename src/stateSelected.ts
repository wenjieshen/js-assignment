
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { SimpleNode, SimplePath } from './simplePath'
import { ConcreteState, State } from './state'
import { DeletePath } from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
export class StateSelected extends State {
  name = 'StateSelected'
  helpRect? : PIXI.Graphics;
  helpLine? : PIXI.Graphics;
  helpCircle? : PIXI.Graphics;
  draging: boolean = false
  mouseOverNode : boolean = true
  dragStatePos = new PIXI.Point()
  shiftPress = false
  onKeyUp: (e: KeyboardEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyDownHandler: (e: KeyboardEvent) => void;
  onKeyUpHandler: (e: KeyboardEvent) => void;
  onMouseOut: () => void;
  onMouseOutHandler : () => void;
  onClickNode: (e:PIXI.interaction.InteractionData) => void
  onClickNodeHandler: (e:PIXI.interaction.InteractionData) => void
  onMouseOver: () => void
  onMouseOverHandler: () => void
  onMouseDown: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseUp: (e:PIXI.interaction.InteractionEvent) => void;
  onMouseMove: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseDownHandler: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseUpHandler: (e:PIXI.interaction.InteractionEvent) => void;
  onMouseMoveHandler: (e: PIXI.interaction.InteractionEvent) => void;
  drawSelectedNode: () => void
  /**
       * constructor of InsertPoint
       * @param {Map} context The properties will be used in every state.
       */
  constructor (context: Context) {
    super(context)
    this.onKeyUp = function (e:KeyboardEvent) {
      if (this.context.app === null) return
      if (e.defaultPrevented) return
      switch (e.key) {
        case 'Delete': {
          const modified = new Map<SimplePath, SimpleNode[]>()
          const remainNodes = new Map<SimplePath, number>()
          this.context.selectedNode.forEach((node) => {
            const currPath = this.context.owner.get(node)!
            const currEntity = this.context.map2PIXI.get(node)!
            this.context.map2Node.delete(currEntity)
            this.context.app?.stage.removeChild(currEntity)
            this.context.owner.delete(node)
            if (modified.get(currPath) === undefined) modified.set(currPath, [])
            if (remainNodes.get(currPath) === undefined) remainNodes.set(currPath, currPath.count)
            modified.get(currPath)!.push(node)
            const remain = remainNodes.get(currPath)! - 1
            remainNodes.set(currPath, remain)
          })
          // Refresh by path
          modified.forEach((nodes, path) => {
            if (remainNodes.get(path)! < 2) {
              DeletePath(this.context, path)
              return
            }
            nodes.forEach(node => {
              path.deletePoint(node)
            })
            path.drawLines()
          })
          this.context.controller.change('Basic')
        }
          break
        case 'Shift':
          this.shiftPress = false
          break
        default:
          break
      }
    }
    this.onMouseOver = function () {
      this.mouseOverNode = true
    }
    this.onMouseOut = function () {
      this.mouseOverNode = false
    }
    this.drawSelectedNode = function () {
      this.helpRect!.clear()
      this.helpRect!.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
      const rectSize = this.context.setting.pointSize * 2
      const offset = rectSize * 0.5
      this.context.selectedNode.forEach((elem) => {
        this.helpRect!.drawRect(elem.data.x - offset, elem.data.y - offset, rectSize, rectSize)
      })
    }
    this.onClickNode = function (e:PIXI.interaction.InteractionData) {
      this.draging = false
      if (!this.shiftPress) return
      this.context.selectedNode.push(this.context.map2Node.get(e.target)!)
      this.drawSelectedNode()
    }
    this.onMouseDown = function (e:PIXI.interaction.InteractionEvent) {
      if (this.shiftPress) return
      this.draging = true
      this.dragStatePos.copyFrom(e.data.global)
    }
    this.onMouseUp = function (e:PIXI.interaction.InteractionEvent) {
      if (!this.draging) return
      this.draging = false
      const dir = new PIXI.Point(e.data.global.x - this.dragStatePos.x, e.data.global.y - this.dragStatePos.y)
      if (Math.sqrt(dir.x * dir.x + dir.y * dir.y) < this.context.setting.pointSize) {
        if (!this.mouseOverNode) {
          this.context.controller.change('Basic')
        }
      } else {
        this.helpLine!.clear()
        // Collect paths for reducing draw calls
        const modified = new Map<SimplePath, SimpleNode[]>()
        this.context.selectedNode.forEach((node) => {
          this.context.map2PIXI.get(node)!.x += dir.x
          this.context.map2PIXI.get(node)!.y += dir.y
          const currPath = this.context.owner.get(node)!
          if (modified.get(currPath) === undefined) modified.set(currPath, [])
          modified.get(currPath)!.push(node)
        })
        // Refresh by path
        modified.forEach((nodes, path) => {
          nodes.forEach(node => path.movePoint(node, dir))
          if (path.isClosed) {
            path.drawFill()
          } else {
            path.drawLines()
          }
        })
        this.drawSelectedNode()
      }
    }
    this.onMouseMove = function (e:PIXI.interaction.InteractionEvent) {
      if (!this.draging) return
      const dir = new PIXI.Point(e.data.global.x - this.dragStatePos.x, e.data.global.y - this.dragStatePos.y)
      if (Math.sqrt(dir.x * dir.x + dir.y * dir.y) < this.context.setting.pointSize) return
      const newPosMap = new Map<SimpleNode, PIXI.Point>()
      this.context.selectedNode.forEach((node) => {
        newPosMap.set(node, new PIXI.Point(node.data.x + dir.x, node.data.y + dir.y))
      })
      this.helpLine!.clear()
      this.helpLine!.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
      this.context.selectedNode.forEach((node) => {
        const prevPos = newPosMap.has(node.prev) ? newPosMap.get(node.prev)! : node.prev.data
        const newPos = newPosMap.get(node)!
        const nextPos = newPosMap.has(node.next) ? newPosMap.get(node.next)! : node.next.data
        this.helpLine!.moveTo(prevPos.x, prevPos.y)
        this.helpLine!.lineTo(newPos.x, newPos.y)
        this.helpLine!.lineTo(nextPos.x, nextPos.y)
      })
    }
    this.onKeyDown = function (event:KeyboardEvent) {
      if (event.key === 'Shift') this.shiftPress = true
    }
    this.onMouseOutHandler = this.onMouseOut.bind(this)
    this.onKeyUpHandler = this.onKeyUp.bind(this)
    this.onClickNodeHandler = this.onClickNode.bind(this)
    this.onMouseOverHandler = this.onMouseOver.bind(this)
    this.onMouseDownHandler = this.onMouseDown.bind(this)
    this.onMouseUpHandler = this.onMouseUp.bind(this)
    this.onMouseMoveHandler = this.onMouseMove.bind(this)
    this.onKeyDownHandler = this.onKeyDown.bind(this)
  }

  /**
       * Confirm there is a directly connect to next state
       * @param {ConcreteState} nextState Notice the state which one is next.
       * @return {boolean} whether the state is able to jump to the next state.
       */
  allow (nextState: ConcreteState): boolean {
    // TODO: Use strategy pattern
    switch (nextState) {
      case 'Basic':
        return true
      default:
    }
    return false
  };

  /**
       * Callback when state starts
       * @param {ConcreteState} prevState Notice the state which state has been switched.
       */
  enter (prevState:ConcreteState) {
    // Initialization
    if (this.context.app === null) return
    /** @todo Extract a inline function (I don't know the best way in TypeScript) */
    if (this.helpRect === undefined) {
      this.helpRect = new PIXI.Graphics()
      this.context.app.stage.addChild(this.helpRect)
    } else {
      this.helpRect.clear()
    }
    if (this.helpCircle === undefined) {
      this.helpCircle = new PIXI.Graphics()
      this.context.app.stage.addChild(this.helpCircle)
    } else {
      this.helpCircle.clear()
    }
    if (this.helpLine === undefined) {
      this.helpLine = new PIXI.Graphics()
      this.context.app.stage.addChild(this.helpLine)
    } else {
      this.helpLine.clear()
    }
    this.mouseOverNode = true
    this.draging = false
    this.helpRect!.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
    const rectSize = this.context.setting.pointSize * 2
    const offset = rectSize * 0.5
    this.helpRect!.drawRect(this.context.selectedNode[0].data.x - offset, this.context.selectedNode[0].data.y - offset, rectSize, rectSize)
    // Event
    this.context.app.renderer.plugins.interaction.addListener('mouseup', this.onMouseUpHandler)
    this.context.app.renderer.plugins.interaction.addListener('mousedown', this.onMouseDownHandler)
    this.context.app.renderer.plugins.interaction.addListener('mousemove', this.onMouseMoveHandler)
    window.addEventListener('keydown', this.onKeyDownHandler)
    window.addEventListener('keyup', this.onKeyUpHandler)
    this.context.paths.forEach((path) => {
      path.nodes.forEach((node) => {
        const entity = this.context.map2PIXI.get(node)!
        entity.interactive = true
        entity.addListener('mouseout', this.onMouseOutHandler)
        entity.addListener('mouseover', this.onMouseOverHandler)
        entity.addListener('click', this.onClickNodeHandler)
      })
    })
  }

  /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
  exit (nextState:string) {
    if (this.context.app === null) return
    this.helpRect!.clear()
    this.helpCircle!.clear()
    this.helpLine!.clear()
    // Remove all event
    this.context.app.renderer.plugins.interaction.removeListener('mouseup', this.onMouseUpHandler)
    this.context.app.renderer.plugins.interaction.removeListener('mousedown', this.onMouseDownHandler)
    this.context.app.renderer.plugins.interaction.removeListener('mousemove', this.onMouseMoveHandler)
    window.removeEventListener('keydown', this.onKeyDownHandler)
    window.removeEventListener('keyup', this.onKeyUpHandler)
    this.context.selectedNode = []
    this.context.paths.forEach((path) => {
      path.nodes.forEach((node) => {
        const entity = this.context.map2PIXI.get(node)!
        entity.interactive = true
        entity.removeListener('mouseout', this.onMouseOutHandler)
        entity.removeListener('mouseover', this.onMouseOverHandler)
        entity.removeListener('click', this.onClickNodeHandler)
      })
    })
  }
}
