import * as PIXI from 'pixi.js'
import { ConcreteState, State } from './state'
import { StateBasic } from './stateBasic'
import { StateEditPath } from './stateEditPath'
import { StateClosePath } from './stateConnectPoint'
import { SimplePath, SimpleNode, SimpleLine } from './simplePath'
import Quadtree from '@timohausmann/quadtree-js'
import { Context } from './context'
import { StateSelected } from './stateSelected'

/** Class controls The states. */
export class StateController {
    context: Context
    states: Map<ConcreteState, State>
    currState: State;
    /**
         * constructor of StateCtrl
         */
    constructor () {
      this.context = {
        app: null,
        editingPath: null,
        controller: this,
        map2PIXI: new Map<SimpleNode, PIXI.Graphics>(),
        map2Node: new Map<PIXI.Graphics, SimpleNode>(),
        owner: new Map<SimpleNode, SimplePath>(),
        pointTree: null,
        paths: [],
        selectedNode: [],
        /** @todo Generate setting by file  */
        setting: {
          pointSize: 5,
          pointColor: 0xf59042,
          pointAlpha: 1,
          hitScale: 1.5,
          lineWidth: 3,
          lineColor: 0xf5e642,
          lineAlpha: 0.5,
          helpLineWidth: 3.5,
          helpLineColor: 0x4272f5,
          helpLineAlpha: 1,
          alignLineWidth: 2.5,
          alignLineColor: 0xf54266,
          alignLineAlpha: 1,
          alignTolerance: 75,
          defaultFillColor: 0x4278f5,
          defaultBackColor: 0x42e3f5,
          defaultFillAlpha: 0.3
        }
      }
      // Create all state in advance.
      this.states = new Map()
      this.currState = new StateBasic(this.context)
      this.states.set('Basic', this.currState)
      this.states.set('EditPath', new StateEditPath(this.context))
      this.states.set('ClosePath', new StateClosePath(this.context))
      this.states.set('Seleted', new StateSelected(this.context))
    }

    /**
       * Start to control the appl
       * @param {PIXI.Application} app the application of PIXI engine
       */
    injectApp (app:PIXI.Application) {
      this.context.app = app
      this.context.pointTree = new Quadtree({ x: 0, y: 0, width: app.renderer.width, height: app.renderer.height })
      // Default state is Insert Point
      this.currState = this.states.get('Basic')!
      this.currState.enter('None')
    }

    /**
       * Change the state to next state
       * @param {string} nextState
       */
    change (nextState:ConcreteState) {
      if (this.currState.allow(nextState)) {
        console.debug('from', this.currState.name)
        const prevSatate = this.currState.name
        this.currState.exit(nextState)
        this.currState = this.states.get(nextState)!
        this.currState.enter(prevSatate)
        console.debug('to', nextState)
      }
    };
}
export {
  SimplePath,
  SimpleNode,
  SimpleLine
}
