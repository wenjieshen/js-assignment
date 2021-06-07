import * as PIXI from 'pixi.js'
import { State } from './state'
import { InsertPoint } from './stateInsertPoint'
import { InsertLine } from './stateInsertLine'
import { ConnectPoint } from './stateConnectPoint'
import { SimplePath, SimpleNode, SimpleLine } from './simplePath'
import Quadtree from '@timohausmann/quadtree-js'

/** Class controls The states. */
class StateCtrl {
    context: Map<string, any>;
    states: Map<string, State>
    currState: State;
    pointTree?: Quadtree;
    lineTree?: Quadtree;
    /**
         * constructor of StateCtrl
         */
    constructor () {
      // Settle the context for manipulation.
      this.context = new Map()
      this.context.set('controller', this)
      this.context.set('app', undefined)
      this.context.set('paths', [])
      this.context.set('mapping', new Map<PIXI.Graphics, SimpleNode>())
      this.context.set('owner', new Map<SimpleNode, SimplePath>())
      // Create all state in advance.
      this.states = new Map()
      this.currState = new InsertPoint(this.context)
      this.states.set('insertPoint', this.currState)
      this.states.set('insertLine', new InsertLine(this.context))
      this.states.set('connectPoint', new ConnectPoint(this.context))
    }

    /**
       * Start to control the appl
       * @param {PIXI.Application} app the application of PIXI engine
       */
    injectApp (app:PIXI.Application) {
      this.context.set('app', app)
      this.pointTree = new Quadtree({ x: 0, y: 0, width: app.renderer.width, height: app.renderer.height })
      this.context.set('pointTree', this.pointTree)
      this.lineTree = new Quadtree({ x: 0, y: 0, width: app.renderer.width, height: app.renderer.height })
      this.context.set('lineTree', this.lineTree)
      // Default state is Insert Point
      this.currState = this.states.get('insertPoint')!
      this.currState.enter('none')
    }

    /**
       * Change the state to next state
       * @param {string} nextState
       */
    change (nextState:string) {
      if (this.currState.allow(nextState)) {
        console.log('from', this.currState.name)
        const prevSatate = this.currState.name
        this.currState.exit(nextState)
        this.currState = this.states.get(nextState)!
        this.currState.enter(prevSatate)
        console.log('to', nextState)
      }
    };
}
export {
  StateCtrl,
  SimplePath,
  SimpleNode,
  SimpleLine
}
