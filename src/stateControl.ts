import * as PIXI from 'pixi.js'
import { State } from './state'
import { InsertPoint } from './stateInsertPoint'
import { InsertLine } from './stateInsertLine'
import { ConnectPoint } from './stateConnectPoint'
import { SimplePath, SimpleNode, SimpleLine } from './simplePath'
import Quadtree from '@timohausmann/quadtree-js'
import { Context } from './context'

/** Class controls The states. */
class StateCtrl {
    context: Context
    states: Map<string, State>
    currState: State;
    /**
         * constructor of StateCtrl
         */
    constructor () {
      this.context = {
        app: null,
        currentPath: null,
        controller: this,
        connection: new Map<SimpleNode, PIXI.Graphics>(),
        mapping: new Map<PIXI.Graphics, SimpleNode>(),
        owner: new Map<SimpleNode, SimplePath>(),
        pointTree: null,
        path: []
      }
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
      this.context.app = app
      this.context.pointTree = new Quadtree({ x: 0, y: 0, width: app.renderer.width, height: app.renderer.height })
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
