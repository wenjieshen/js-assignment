
import * as PIXI from 'pixi.js'
import { Context } from './context'
import { State, ConcreteState } from './state'
import { SimplePath, SimpleNode } from './stateController'
import { BeforeDeletePath } from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
export class StateEditPath extends State {
    name = 'StateEditPath'
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
        console.debug(e)
      }
      this.onMouseOverHead = function () {
        this.context.controller.change('ClosePath')
      }
      this.onMouseOverHeadHandler = this.onMouseOverHead.bind(this)
      this.onKeyUp = function (e:KeyboardEvent) {
        if (e.defaultPrevented) {
          return
        }
        if (e.key === 'Esc' || e.key === 'Escape') {
          if (this.context.editingPath!.count === 1) {
            BeforeDeletePath(this.context, this.context.editingPath!)
            this.context.editingPath = null
          }
          this.context.controller.change('Basic')
        }
      }
      this.onClick = function () {
        if (this.context.app === null) return
        // Initilize container
        const map2PIXI:Map<SimpleNode, PIXI.Graphics> = this.context.map2PIXI
        const map2Node:Map<PIXI.DisplayObject, SimpleNode> = this.context.map2Node
        const owner:Map<SimpleNode, SimplePath> = this.context.owner
        // Create new entity of engine
        const mousePos = this.context.app.renderer.plugins.interaction.mouse.global
        const newEntity = new PIXI.Graphics()
        newEntity.x = mousePos.x
        newEntity.y = mousePos.y
        newEntity.hitArea = new PIXI.Circle(0, 0, this.context.setting.pointSize * this.context.setting.hitScale)
        this.context.app.stage.addChild(newEntity)
        // Add the entity to my path
        const node = this.context.editingPath!.addNewPoint(new PIXI.Point(newEntity.x, newEntity.y), this.context.pointTree!)
        map2PIXI.set(node, newEntity)
        map2Node.set(newEntity, node)
        owner.set(node, this.context.editingPath!)
        //
        // Add necessary events
        const editingPath = this.context.editingPath!
        if (editingPath.nodes.size > 2) {
          const headEntity = map2PIXI.get(editingPath.head)!
          headEntity.on('mouseover', this.onMouseOverHeadHandler)
          headEntity.interactive = true
        }
        //
        if (editingPath.nodes.size === 2) {
          this.context.paths.push(this.context.editingPath!)
        }
      }
      this.onUpdate = function () {
        if (this.context.app === null) return
        const helpLine = this.helpLine!
        const lastPoint = this.context.editingPath!.tail.data
        const mousePos = this.context.app.renderer.plugins.interaction.mouse.global
        helpLine.clear()
        helpLine.lineStyle(this.context.setting.helpLineWidth, this.context.setting.helpLineColor, this.context.setting.helpLineAlpha)
        helpLine.moveTo(lastPoint.x, lastPoint.y)
        helpLine.lineTo(mousePos.x, mousePos.y)
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
    allow (nextState: ConcreteState): boolean {
      // TODO: Use strategy pattern
      switch (nextState) {
        case 'Basic':
          return true
        case 'ClosePath':
          return true
        default:
      }
      return false
    };

    /**
       * Callback when state starts
       * @param {string} prevState Notice the state which state has been switched.
       */
    enter (prevState:ConcreteState) {
      if (this.context.app === null) return
      if (this.helpLine === undefined) {
        this.helpLine = new PIXI.Graphics()
        this.context.app.stage.addChild(this.helpLine)
      } else {
        this.helpLine.clear()
      }
      if (this.context.editingPath!.nodes.size > 2) {
        const headEntity = this.context.map2PIXI.get(this.context.editingPath!.head)!
        headEntity.on('mouseover', this.onMouseOverHeadHandler)
        headEntity.interactive = true
      }
      this.context.app.renderer.view.addEventListener('click', this.onClickHandler)
      this.context.app.ticker.add(this.onUpdateHandler)
      window.addEventListener('keyup', this.onKeyUpHandler)
    }

    /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
    exit (nextState:ConcreteState) {
      if (this.context.app === null) return
      this.context.app.ticker.remove(this.onUpdateHandler)
      if (this.helpLine !== undefined) {
        this.helpLine.clear()
      }
      if (this.context.editingPath !== null) {
        const headEntity = this.context.map2PIXI.get(this.context.editingPath!.head)!
        headEntity.removeListener('mouseover', this.onMouseOverHeadHandler)
        headEntity.interactive = false
      }
      this.context.app.renderer.view.removeEventListener('click', this.onClickHandler)
      window.removeEventListener('keyup', this.onKeyUpHandler)
    }
}
