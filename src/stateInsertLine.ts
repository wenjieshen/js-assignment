
import * as PIXI from 'pixi.js'
import { State } from './state'
import { SimplePath, SimpleNode, StateCtrl } from './stateControl'
import * as UTILITY from './utility'
/**
   * The class describes the state of editor when a line should be inserted
   */
class InsertLine extends State {
    app?: PIXI.Application;
    helpLine? : PIXI.Graphics;
    currGraph? : SimplePath;
    paths?: SimplePath[];
    onClick: () => void;
    onClickHandler: () => void;
    onUpdate: () => void;
    onUpdateHandler: () => void;
    onKeyUp: (e: KeyboardEvent) => void;
    onKeyUpHandler: (e: KeyboardEvent) => void;
    onMouseOver: (e:PIXI.interaction.InteractionEvent) => void;
    onMouseOverHandler: (e:PIXI.interaction.InteractionEvent) => void;
    /**
       * constructor of InsertPoint
       * @param {Map} context The properties will be used in every state.
       */
    constructor (context: Map<string, any>) {
      super(context)
      this.onMouseOver = function (e) {
        this.context.set('mouseTarget', e.currentTarget)
        const ctrl:StateCtrl = this.context.get('controller')!
        ctrl.change('connectPoint')
      }
      this.onKeyUp = function (e:KeyboardEvent) {
        if (e.defaultPrevented) {
          return
        }
        if (e.key === 'Esc' || e.key === 'Escape') {
          if (this.app === undefined) return
          const lastPoint:PIXI.Graphics = this.context.get('lastPoint')!
          if (this.currGraph === undefined) {
            this.app.stage.removeChild(lastPoint)
          }
          this.context.set('lastPoint', undefined)
          const ctrl:StateCtrl = this.context.get('controller')!
          ctrl.change('insertPoint')
        }
      }
      this.onClick = function () {
        if (this.app === undefined) return
        const lastPoint:PIXI.Graphics = this.context.get('lastPoint')!
        const mapping:Map<PIXI.Graphics, SimpleNode> = this.context.get('mapping')!
        const owner:Map<SimpleNode, SimplePath> = this.context.get('owner')!
        // Create a new graph if this is the first line
        if (this.currGraph === undefined) {
          this.currGraph = UTILITY.AddNewGraph(lastPoint, this.app.stage, owner, mapping)
          this.context.set('currentGraph', this.currGraph)
          this.context.get('paths').push(this.currGraph)
          UTILITY.DrawSolidPoint(lastPoint)
          this.currGraph.head.data.interactive = true
          this.currGraph.head.data.on('mouseover', this.onMouseOverHandler)
        }
        // Move point
        const mousePos = this.app.renderer.plugins.interaction.mouse.global
        // Add the current posistion into graph
        const newEntity = new PIXI.Graphics()
        newEntity.x = mousePos.x
        newEntity.y = mousePos.y
        const parent:SimpleNode = mapping.get(lastPoint)!
        this.currGraph!.addNewPoint(newEntity, owner, mapping, parent)
        UTILITY.DrawSolidPoint(newEntity)
        this.app.stage.addChild(newEntity)

        this.context.set('lastPoint', newEntity)
      }
      this.onUpdate = function () {
        if (this.app !== undefined) {
          const helpLine = this.helpLine!
          const lastPoint = this.context.get('lastPoint')
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
      this.onMouseOverHandler = this.onMouseOver.bind(this)
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
      this.app = this.context.get('app')!
      this.paths = this.context.get('paths')!
      if (this.app !== undefined) {
        if (this.helpLine === undefined) {
          this.helpLine = new PIXI.Graphics()
          this.app.stage.addChild(this.helpLine)
        } else {
          this.helpLine.clear()
        }
        // Add necessary events
        this.app.renderer.view.addEventListener('click', this.onClickHandler)
        this.app.ticker.add(this.onUpdateHandler)
        window.addEventListener('keyup', this.onKeyUpHandler)
        this.paths!.forEach((graph) => {
          graph.points.forEach((node) => {
            node.data.on('mouseover', this.onMouseOverHandler)
          })
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
        this.app.renderer.view.removeEventListener('click', this.onClickHandler)
        window.removeEventListener('keyup', this.onKeyUpHandler)
        this.paths?.forEach((graph) => {
          graph.points.forEach((node) => {
            node.data.removeListener('mouseover', this.onMouseOverHandler)
          })
        })
      }
    }
}
export {
  InsertLine
}
