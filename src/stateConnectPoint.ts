
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { State } from './state'
import { SimplePath, StateCtrl } from './stateControl'
import { BeforeDeletePath } from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
class ConnectPoint extends State {
    name = 'ConnectPoint'
    app?: PIXI.Application;
    helpLine? : PIXI.Graphics;
    helpCircle? : PIXI.Graphics;
    mouseTarget? : PIXI.Graphics;
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
          if (this.app === undefined) return
          if (this.context.currentPath!.count === 1) {
            BeforeDeletePath(this.context, this.context.currentPath!)
            delete this.context.currentPath
            this.context.currentPath = null
          }
          const ctrl:StateCtrl = this.context.controller
          ctrl.change('insertPoint')
        }
      }
      this.onClick = function () {
        if (this.app === undefined) return
        const currGraph:SimplePath = this.context.currentPath!
        currGraph!.closePath()
        const ctrl:StateCtrl = this.context.controller
        ctrl.change('insertPoint')
      }
      this.onUpdate = function (delta:number) {
        if (this.app !== undefined) {
          const helpLine = this.helpLine!
          const helpCircle = this.helpCircle!
          const lastPoint = this.context.currentPath!.tail.data
          const mousePos = this.app.renderer.plugins.interaction.mouse.global
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
      }
      this.onMouseOut = function () {
        const ctrl:StateCtrl = this.context.controller
        ctrl.change('insertLine')
      }
      this.onMouseOutHander = this.onMouseOut.bind(this)
      this.onKeyUpHandler = this.onKeyUp.bind(this)
      this.onClickHandler = this.onClick.bind(this)
      this.onUpdateHandler = this.onUpdate.bind(this)
      this.aniScale = this.context.setting.pointSize
    }

    /**
       * Confirm there is a directly connect to next state
       * @param {string} nextState Notice the state which one is next.
       * @return {boolean} whether the state is able to jump to the next state.
       */
    allow (nextState: string): boolean {
      // TODO: Use strategy pattern
      switch (nextState) {
        case 'insertLine':
          return true
        case 'insertPoint':
          return true
        default:
      }
      return false
    };

    /**
       * Callback when state starts
       * @param {string} prevState Notice the state which state has been switched.
       */
    enter (prevState:string) {
      this.app = this.context.app!
      if (this.app !== undefined) {
        if (this.helpLine === undefined) {
          this.helpLine = new PIXI.Graphics()
          this.app.stage.addChild(this.helpLine)
        } else {
          this.helpLine.clear()
        }
        if (this.helpCircle === undefined) {
          this.helpCircle = new PIXI.Graphics()
          this.app.stage.addChild(this.helpCircle)
        } else {
          this.helpCircle.clear()
        }
        // Event
        this.app.renderer.view.addEventListener('click', this.onClickHandler)
        this.app.ticker.add(this.onUpdateHandler)
        this.mouseTarget = this.context.connection.get(this.context.currentPath!.head)!
        this.mouseTarget!.interactive = true
        this.mouseTarget!.on('mouseout', this.onMouseOutHander)
        this.aniScale = this.context.setting.pointSize
      }
    }

    /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
    exit (nextState:string) {
      if (this.app !== undefined) {
        if (this.helpLine !== undefined) {
          this.helpLine.clear()
        }
        if (this.helpCircle !== undefined) {
          this.helpCircle.clear()
        }
        // Remove all event
        this.app.ticker.remove(this.onUpdateHandler)
        this.app.renderer.view.removeEventListener('click', this.onClickHandler)
        window.removeEventListener('keyup', this.onKeyUpHandler)
        this.mouseTarget?.removeListener('mouseout', this.onMouseOutHander)
        this.mouseTarget!.interactive = false
      }
    }
}
export {
  ConnectPoint
}
