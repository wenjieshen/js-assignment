import * as PIXI from 'pixi.js'
import { Context } from './context'
import { State } from './state'
import { SimpleNode, SimplePath } from './stateControl'
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
    constructor (context: Context) {
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
        // Create a current path
        const head = new SimpleNode(new PIXI.Point(pointEntity.x, pointEntity.y), 0)
        this.context.connection.set(head, pointEntity)
        this.context.mapping.set(pointEntity, head)
        this.context.currentPath = new SimplePath(head, this.app.stage.addChild(new PIXI.Graphics()))
        this.context.owner.set(head, this.context.currentPath)
        //
        this.context.controller.change('insertLine')
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
      this.app = this.context.app!
      this.context.currentPath = null
      this.app.renderer.view.addEventListener('click', this.onClickHandler)
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
