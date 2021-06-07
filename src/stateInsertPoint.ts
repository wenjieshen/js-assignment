import * as PIXI from 'pixi.js'
import { State } from './state'
import { StateCtrl } from './stateControl'
import * as UTILITY from './utility'

/**
   * The class describes the state of editor when a point should be inserted
   */
class InsertPoint extends State {
    name = 'InsertPoint'
    app?: PIXI.Application;
    onClick: () => void;
    onClickHandler: () => void;
    /**
       * constructor of InsertPoint
       * @param {Map} context The properties will be used in every state.
       */
    constructor (context: Map<string, any>) {
      super(context)
      this.onClick = function () {
        if (this.app === undefined) {
          return
        }
        const mousePos = this.app.renderer.plugins.interaction.mouse.global
        // TODO: Use command pattern
        // Create a root entity
        const pointEntity = new PIXI.Graphics()
        // Draw a basic point
        UTILITY.DrawHoledPoint(pointEntity)
        this.app.stage.addChild(pointEntity)
        pointEntity.x = mousePos.x
        pointEntity.y = mousePos.y
        console.log(pointEntity.x, pointEntity.y)
        this.context.set('lastPoint', pointEntity)
        const ctrl:StateCtrl = this.context.get('controller')!
        ctrl.change('insertLine')
      }
      this.onClickHandler = this.onClick.bind(this)
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
        default:
      }
      return false
    };

    /**
       * Callback when state starts
       * @param {string} prevState Notice the state which state has been switched.
       */
    enter (prevState:string) {
      this.app = this.context.get('app')
      if (this.app !== undefined) {
        this.app.renderer.view.addEventListener('click', this.onClickHandler)
      }
    }

    /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
    exit (nextState:string) {
      if (this.app !== undefined) {
        this.app.renderer.view.removeEventListener('click', this.onClickHandler)
      }
    }
}

export {
  InsertPoint
}
