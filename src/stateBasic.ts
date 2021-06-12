import * as PIXI from 'pixi.js'
import { Context } from './context'
import { PathViewSetting } from './simplePath'
import { State, ConcreteState } from './state'
import { SimpleNode, SimplePath } from './stateController'

/**
   * The class describes the state of editor when a point should be inserted
   */
export class StateBasic extends State {
  defaultPathViewSetting:PathViewSetting;
  name = 'StateBasic'
  onClick: () => void;
  onClickHandler: () => void;
  onMouseOver: () => void
  onMouseOut: () => void
  onClickNode: (e: PIXI.interaction.InteractionData) => void
  onClickNodeHandler: (e: PIXI.interaction.InteractionData) => void
  onMouseOverHandler: () => void
  onMouseOutHandler: () => void
  mouseOverNode = false
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
      console.debug(this.mouseOverNode)
      if (this.context.app === null) return
      if (this.mouseOverNode) return
      const mousePos = this.context.app.renderer.plugins.interaction.mouse.global
      /**
      /* @todo: Use command pattern
      /* Create a root entity
      */
      const newEntity = new PIXI.Graphics()
      // Draw a basic point
      this.context.app.stage.addChild(newEntity)
      newEntity.x = mousePos.x
      newEntity.y = mousePos.y
      newEntity.hitArea = new PIXI.Circle(0, 0, this.context.setting.pointSize * this.context.setting.hitScale)
      // Create a current path
      const head = new SimpleNode(new PIXI.Point(newEntity.x, newEntity.y), 1)
      this.context.map2PIXI.set(head, newEntity)
      this.context.map2Node.set(newEntity, head)
      this.context.editingPath = new SimplePath(head, this.context.app.stage.addChild(new PIXI.Graphics()), this.defaultPathViewSetting)
      this.context.owner.set(head, this.context.editingPath)
      //
      this.context.controller.change('EditPath')
    }
    this.onMouseOver = function () {
      this.mouseOverNode = true
    }
    this.onMouseOut = function () {
      this.mouseOverNode = false
    }
    this.onClickNode = function (e:PIXI.interaction.InteractionData) {
      this.context.selectedNode.push(this.context.map2Node.get(e.target)!)
      this.context.controller.change('Seleted')
    }
    this.onClickHandler = this.onClick.bind(this)
    this.onClickNodeHandler = this.onClickNode.bind(this)
    this.onMouseOverHandler = this.onMouseOver.bind(this)
    this.onMouseOutHandler = this.onMouseOut.bind(this)
  }

  /**
       * Confirm there is a directly connect to next state
       * @param {string} nextState Notice the state which one is next.
       * @return {boolean} whether the state is able to jump to the next state.
       */
  allow (nextState: ConcreteState): boolean {
    // TODO: Use strategy pattern
    switch (nextState) {
      case 'EditPath':
        return true
      case 'Seleted':
        return true
      default:
    }
    return false
  };

  /**
       * Callback when state starts
       * @param {ConcreteState} prevState Notice the state which state has been switched.
       */
  enter (prevState:ConcreteState) {
    this.mouseOverNode = (prevState !== 'None' && prevState !== 'Seleted')
    this.context.editingPath = null
    this.context.app!.renderer.view.addEventListener('click', this.onClickHandler)
    this.context.paths.forEach((path) => {
      path.nodes.forEach((node) => {
        const entity = this.context.map2PIXI.get(node)!
        entity.interactive = true
        entity.addListener('mouseout', this.onMouseOutHandler)
        entity.addListener('mouseover', this.onMouseOverHandler)
        entity.addListener('click', this.onClickNodeHandler)
      })
    })
  }

  /**
       * Callback when state exit
       * @param {string} nextState Notice the state which one is next.
       */
  exit (nextState:ConcreteState) {
    if (this.context.app === null) return
    this.mouseOverNode = false
    this.context.app.renderer.view.removeEventListener('click', this.onClickHandler)
    this.context.paths.forEach((path) => {
      path.nodes.forEach((node) => {
        const entity = this.context.map2PIXI.get(node)!
        entity.interactive = false
        entity.removeListener('mouseout', this.onMouseOutHandler)
        entity.removeListener('mouseover', this.onMouseOverHandler)
        entity.removeListener('click', this.onClickNodeHandler)
      })
    })
  }
}
