import * as PIXI from 'pixi.js'
import { Context } from './context'
import { PathViewSetting } from './simplePath'
import { State } from './state'
import { SimpleNode, SimplePath } from './stateControl'

/**
   * The class describes the state of editor when a point should be inserted
   */
class InsertPoint extends State {
    defaultPathViewSetting:PathViewSetting;
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
      this.defaultPathViewSetting = {
        pointSize: this.context.setting.pointSize,
        pointColor: this.context.setting.pointColor,
        pointAlpha: this.context.setting.pointAlpha,
        lineWidth: this.context.setting.lineWidth,
        lineColor: this.context.setting.lineColor,
        lineAlpha: this.context.setting.lineAlpha,
        fillColor: this.context.setting.defaultFillColor,
        backColor: this.context.setting.defaultBackColor,
        fillAlpha: this.context.setting.defaultFillAlpha
      }
      this.onClick = function () {
        if (this.app === undefined) {
          return
        }
        const mousePos = this.app.renderer.plugins.interaction.mouse.global
        // TODO: Use command pattern
        // Create a root entity
        const pointEntity = new PIXI.Graphics()
        // Draw a basic point
        this.app.stage.addChild(pointEntity)
        pointEntity.x = mousePos.x
        pointEntity.y = mousePos.y
        pointEntity.hitArea = new PIXI.Circle(0, 0, this.defaultPathViewSetting.pointSize * this.context.setting.hitScale)
        // Create a current path
        const head = new SimpleNode(new PIXI.Point(pointEntity.x, pointEntity.y), 1)
        this.context.connection.set(head, pointEntity)
        this.context.mapping.set(pointEntity, head)
        this.context.currentPath = new SimplePath(head, this.app.stage.addChild(new PIXI.Graphics()), this.defaultPathViewSetting)
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
