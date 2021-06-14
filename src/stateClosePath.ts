
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { State, ConcreteState } from './state'
import { SimplePath } from './stateController'
import { DeletePath } from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
export class StateClosePath extends State {
    name = 'StateClosePath'
    helpLine? : PIXI.Graphics;
    helpCircle? : PIXI.Graphics;
    closeTarget? : PIXI.Graphics;
    aniScale: number
    onClick: () => void;
    onClickHandler: () => void;
    onUpdate: (delta:number) => void;
    onUpdateHandler: (delta:number) => void;
    onKeyUp: (e: KeyboardEvent) => void;
    onKeyUpHandler: (e: KeyboardEvent) => void;
    onMouseOut: () => void;
    onMouseOutHander : () => void;
    /**
       * constructor of InsertPoint
       * @param {Map} context The properties will be used in every state.
       */
    constructor (context: Context) {
      super(context)
      this.onKeyUp = function (e:KeyboardEvent) {
        if (e.defaultPrevented) {
          return
        }
        if (e.key === 'Esc' || e.key === 'Escape') {
          if (this.context.app === null) return
          if (this.context.editingPath!.count === 1) {
            DeletePath(this.context, this.context.editingPath!)
            this.context.editingPath = null
          }
          this.context.controller.change('Basic')
        }
      }
      this.onClick = function () {
        if (this.context.app === null) return
        const currGraph:SimplePath = this.context.editingPath!
        currGraph!.closePath()
        this.context.controller.change('Basic')
      }
      this.onUpdate = function (delta:number) {
        if (this.context.app === null) return
        const helpLine = this.helpLine!
        const helpCircle = this.helpCircle!
        const lastPoint = this.context.editingPath!.tail.data
        const mousePos = this.context.app.renderer.plugins.interaction.mouse.global
        helpLine.clear()
        helpLine.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
        helpLine.moveTo(lastPoint.x, lastPoint.y)
        helpLine.lineTo(mousePos.x, mousePos.y)
        // Helper circle
        helpCircle.clear()
        helpCircle.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor)
        helpCircle.drawCircle(mousePos.x, mousePos.y, this.aniScale)
        const maxSize = this.context.setting.pointSize * 7.5
        const v = 0.75
        this.aniScale += delta * v
        if (this.aniScale > maxSize) {
          this.aniScale = this.context.setting.pointSize
        }
      }
      this.onMouseOut = function () {
        this.context.controller.change('EditPath')
      }
      this.onMouseOutHander = this.onMouseOut.bind(this)
      this.onKeyUpHandler = this.onKeyUp.bind(this)
      this.onClickHandler = this.onClick.bind(this)
      this.onUpdateHandler = this.onUpdate.bind(this)
      this.aniScale = this.context.setting.pointSize
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
        case 'EditPath':
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
      if (this.context.app === null) return
      if (this.helpLine === undefined) {
        this.helpLine = new PIXI.Graphics()
        this.context.app.stage.addChild(this.helpLine)
      } else {
        this.helpLine.clear()
      }
      if (this.helpCircle === undefined) {
        this.helpCircle = new PIXI.Graphics()
        this.context.app.stage.addChild(this.helpCircle)
      } else {
        this.helpCircle.clear()
      }
      // Event
      this.context.app.renderer.view.addEventListener('click', this.onClickHandler)
      this.context.app.ticker.add(this.onUpdateHandler)
      this.closeTarget = this.context.map2PIXI.get(this.context.editingPath!.head)!
      this.closeTarget.interactive = true
      this.closeTarget.on('mouseout', this.onMouseOutHander)
      this.aniScale = this.context.setting.pointSize
    }

    /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
    exit (nextState:string) {
      if (this.context.app === null) return
      if (this.helpLine !== undefined) {
        this.helpLine.clear()
      }
      if (this.helpCircle !== undefined) {
        this.helpCircle.clear()
      }
      // Remove all event
      this.context.app.ticker.remove(this.onUpdateHandler)
      this.context.app.renderer.view.removeEventListener('click', this.onClickHandler)
      window.removeEventListener('keyup', this.onKeyUpHandler)
      this.closeTarget?.removeListener('mouseout', this.onMouseOutHander)
      this.closeTarget!.interactive = false
    }
}
