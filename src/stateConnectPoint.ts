
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
    animaDelta: number
    onClick: () => void;
    onClickHandler: () => void;
    onUpdate: () => void;
    onUpdateHandler: () => void;
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
        currGraph!.closePath(this.context.lineTree!)
        const ctrl:StateCtrl = this.context.controller
        ctrl.change('insertPoint')
      }
      this.onUpdate = function () {
        if (this.app !== undefined) {
          const helpLine = this.helpLine!
          const lastPoint = this.context.currentPath!.tail.data
          const mousePos = this.app.renderer.plugins.interaction.mouse.global
          helpLine.clear()
          helpLine.lineStyle(15, 0x000000, 0.8, 1, true)
          helpLine.moveTo(lastPoint.x, lastPoint.y)
          helpLine.lineTo(mousePos.x, mousePos.y)
          // Helper circle
          this.helpCircle!.scale.x = this.animaDelta
          this.helpCircle!.scale.y = this.animaDelta
          this.animaDelta += 0.1
          if (this.animaDelta > 1.5) {
            this.animaDelta = 1.0
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
      this.animaDelta = 1
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
        // Helper
        this.mouseTarget = this.context.currentPath!.head.data
        this.mouseTarget!.tint = 0xC0392B
        // Helper
        this.helpCircle.lineStyle(3, 0x2E86C1)
        this.helpCircle.beginFill(0xFFFFFF, 1)
        this.helpCircle.drawCircle(0, 0, 6)
        this.helpCircle.endFill()
        this.helpCircle.x = this.mouseTarget!.x
        this.helpCircle.y = this.mouseTarget!.y
        // Event
        this.app.renderer.view.addEventListener('click', this.onClickHandler)
        this.app.ticker.add(this.onUpdateHandler)
        this.mouseTarget!.on('mouseout', this.onMouseOutHander)
        this.animaDelta = 1
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
        this.mouseTarget!.tint = 0xFFFFFF
      }
    }
}
export {
  ConnectPoint
}
