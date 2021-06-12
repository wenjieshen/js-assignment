
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { ConcreteState, State } from './state'
/**
   * The class describes the state of editor when a line should be inserted
   */
export class StateSelected extends State {
  name = 'StateSelected'
  helpRect? : PIXI.Graphics;
  helpLine? : PIXI.Graphics;
  helpCircle? : PIXI.Graphics;
  pressShift: boolean = false
  draging: boolean = false
  mouseOverNode : boolean = true
  dragStatePos = new PIXI.Point()
  onClick: () => void;
  onClickHandler: () => void;
  onKeyUp: (e: KeyboardEvent) => void;
  onKeyUpHandler: (e: KeyboardEvent) => void;
  onMouseOut: () => void;
  onMouseOutHandler : () => void;
  onClickNode: (e:PIXI.interaction.InteractionData) => void
  onClickNodeHandler: (e:PIXI.interaction.InteractionData) => void
  onMouseOver: () => void
  onMouseOverHandler: () => void
  onKeyDown: (e: KeyboardEvent) => void;
  onMouseDown: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseUp: () => void;
  onMouseMove: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseDownHandler: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseUpHandler: () => void;
  onMouseMoveHandler: (e: PIXI.interaction.InteractionEvent) => void;
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
        case 'Shift':
          this.pressShift = false
          break
        case 'Delete':
        case 'Esc':
        case 'Escape':
          this.context.controller.change('Basic')
          break
        default:
          break
      }
    }
    this.onKeyDown = function (e:KeyboardEvent) {
      this.pressShift = true
    }
    this.onClick = function () {
      if (!this.draging && !this.mouseOverNode) {
        this.context.controller.change('Basic')
      }
    }
    this.onMouseOver = function () {
      this.mouseOverNode = true
    }
    this.onMouseOut = function () {
      this.mouseOverNode = false
    }
    this.onClickNode = function (e:PIXI.interaction.InteractionData) {
      if (!this.pressShift) return
      this.context.selectedNode.push(this.context.map2Node.get(e.target)!)
      this.helpRect!.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
      const rectSize = this.context.setting.pointSize * 2
      const offset = rectSize * 0.5
      this.helpRect!.drawRect(this.context.selectedNode[0].data.x - offset, this.context.selectedNode[0].data.y - offset, rectSize, rectSize)
    }
    this.onMouseDown = function (e:PIXI.interaction.InteractionEvent) {
      if (this.pressShift) return
      this.draging = true
      this.dragStatePos.copyFrom(e.data.global)
    }
    this.onMouseUp = function () {
      this.draging = false
    }
    this.onMouseMove = function (e:PIXI.interaction.InteractionEvent) {
      if (!this.draging) return
      const dir = new PIXI.Point(e.data.global.x - this.dragStatePos.x, e.data.global.y - this.dragStatePos.y)
      this.helpLine!.clear()
      this.context.selectedNode.forEach((node) => {
        const newPos = new PIXI.Point(node.data.x + dir.x, node.data.y + dir.y)
        this.helpLine!.moveTo(node.prev.data.x, node.prev.data.y)
        this.helpLine!.lineTo(newPos.x, newPos.y)
        this.helpLine!.lineTo(node.next.data.x, node.next.data.y)
      })
    }
    this.onMouseOutHandler = this.onMouseOut.bind(this)
    this.onKeyUpHandler = this.onKeyUp.bind(this)
    this.onClickHandler = this.onClick.bind(this)
    this.onClickNodeHandler = this.onClickNode.bind(this)
    this.onMouseOverHandler = this.onMouseOver.bind(this)
    this.onMouseDownHandler = this.onMouseDown.bind(this)
    this.onMouseUpHandler = this.onMouseUp.bind(this)
    this.onMouseMoveHandler = this.onMouseMove.bind(this)
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
    this.helpRect!.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
    const rectSize = this.context.setting.pointSize * 2
    const offset = rectSize * 0.5
    this.helpRect!.drawRect(this.context.selectedNode[0].data.x - offset, this.context.selectedNode[0].data.y - offset, rectSize, rectSize)
    // Event
    this.context.app.renderer.plugins.interaction.addListener('click', this.onClickHandler)
    this.context.app.renderer.plugins.interaction.addListener('mousedown', this.onMouseDownHandler)
    this.context.app.renderer.plugins.interaction.addListener('mousemove', this.onMouseMoveHandler)
    this.context.app.renderer.plugins.interaction.addListener('mouseup', this.onMouseUpHandler)
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
    if (this.helpRect !== undefined) {
      this.helpRect.clear()
    }
    if (this.helpCircle !== undefined) {
      this.helpCircle.clear()
    }
    // Remove all event
    this.context.app.renderer.plugins.interaction.removeListener('click', this.onClickHandler)
    this.context.app.renderer.plugins.interaction.removeListener('mousedown', this.onMouseDownHandler)
    this.context.app.renderer.plugins.interaction.removeListener('mousemove', this.onMouseMoveHandler)
    this.context.app.renderer.plugins.interaction.removeListener('mouseup', this.onMouseUpHandler)
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
