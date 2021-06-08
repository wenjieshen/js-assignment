
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { State } from './state'
import { SimplePath, SimpleNode, StateCtrl } from './stateControl'
import { BeforeDeletePath } from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
class InsertLine extends State {
    name = 'InsertLine'
    app?: PIXI.Application;
    helpLine? : PIXI.Graphics;
    onClick: () => void;
    onClickHandler: () => void;
    onUpdate: () => void;
    onUpdateHandler: () => void;
    onKeyUp: (e: KeyboardEvent) => void;
    onKeyUpHandler: (e: KeyboardEvent) => void;
    onMouseOverOtherPath: (e:PIXI.interaction.InteractionEvent) => void;
    onMouseOverOtherPathHandler: (e:PIXI.interaction.InteractionEvent) => void;
    onMouseOverHead: () => void
    onMouseOverHeadHandler: () => void
    /**
       * constructor of InsertPoint
       * @param {Map} context The properties will be used in every state.
       */
    constructor (context:Context) {
      super(context)
      this.onMouseOverOtherPath = function (e) {
        console.log(e)
      }
      this.onMouseOverHead = function () {
        this.context.controller.change('connectPoint')
      }
      this.onMouseOverHeadHandler = this.onMouseOverHead.bind(this)
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
        // Initilize container
        const mapping:Map<PIXI.Graphics, SimpleNode> = this.context.mapping
        const owner:Map<SimpleNode, SimplePath> = this.context.owner
        // Create new entity of engine
        const mousePos = this.app.renderer.plugins.interaction.mouse.global
        const newEntity = new PIXI.Graphics()
        newEntity.x = mousePos.x
        newEntity.y = mousePos.y
        this.app.stage.addChild(newEntity)
        // Add the entity to my path
        const node = this.context.currentPath!.addNewPoint(newEntity, this.context.pointTree!, this.context.lineTree!)
        mapping.set(newEntity, node)
        owner.set(node, this.context.currentPath!)
        //
        // Add necessary events
        this.context.currentPath!.head.data.on('mouseover', this.onMouseOverHeadHandler)
        this.context.currentPath!.head.data.interactive = true
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
        }
      }
      this.onKeyUpHandler = this.onKeyUp.bind(this)
      this.onClickHandler = this.onClick.bind(this)
      this.onUpdateHandler = this.onUpdate.bind(this)
      this.onMouseOverOtherPathHandler = this.onMouseOverOtherPath.bind(this)
    }

    /**
       * Confirm there is a directly connect to next state
       * @param {string} nextState Notice the state which one is next.
       * @return {boolean} whether the state is able to jump to the next state.
       */
    allow (nextState: string): boolean {
      // TODO: Use strategy pattern
      switch (nextState) {
        case 'insertPoint':
          return true
        case 'connectPoint':
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
        this.app.renderer.view.addEventListener('click', this.onClickHandler)
        this.app.ticker.add(this.onUpdateHandler)
        window.addEventListener('keyup', this.onKeyUpHandler)
        this.context.path.forEach((path) => {
          if (path.head !== path.tail) {
            path.head.data.on('mouseover', this.onMouseOverOtherPathHandler)
            path.tail.data.on('mouseover', this.onMouseOverOtherPathHandler)
          }
        })
      }
    }

    /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
    exit (nextState:string) {
      if (this.app !== undefined) {
        this.app.ticker.remove(this.onUpdateHandler)
        if (this.helpLine !== undefined) {
          this.helpLine.clear()
        }
        if (this.context.currentPath !== null) {
          this.context.currentPath!.head.data.removeListener('mouseover', this.onMouseOverHeadHandler)
          this.context.currentPath!.head.data.interactive = false
        }
        this.app.renderer.view.removeEventListener('click', this.onClickHandler)
        window.removeEventListener('keyup', this.onKeyUpHandler)
        this.context.path.forEach((path) => {
          path.points.forEach((node) => {
            if (path.head !== path.tail) {
              path.head.data.removeListener('mouseover', this.onMouseOverOtherPathHandler)
              path.tail.data.removeListener('mouseover', this.onMouseOverOtherPathHandler)
              path.tail.data.interactive = false
              path.head.data.interactive = false
            }
          }
          )
        })
      }
    }
}
export {
  InsertLine
}
