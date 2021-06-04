
import * as PIXI from 'pixi.js'
/**
   * The class describes the state of the editor
   */
class State {
  name: any;
  sharedProps: Map<string, any>;
  /**
     * constructor of InsertPoint
     * @param {Map} sharedProps The properties will be used in every state.
     */
  constructor (sharedProps: Map<string, any>) {
    this.sharedProps = sharedProps
  }

  /**
     * Confirm there is a directly connect to next state
     * @param {string} _nextState Notice the state which one is next.
     * @return {boolean} whether the state is able to jump to the next state.
     */
  allow (nextState:string): boolean {
    return false
  }

  /**
     * Callback when state starts
     * @param {string} prevState Notice the state which state has been switched.
     */
  enter (prevState:string) {
  }

  /**
     * Callback when state exit
     * @param {string} nextState Notice the state which one is next.
     */
  exit (nextState:string) {
  }
}
/** Class controls The states. */
class StateCtrl {
  sharedProps: Map<string, any>;
  states: Map<string, State>
  currState: State;
  /**
       * constructor of StateCtrl
       */
  constructor () {
    this.sharedProps = new Map()
    this.sharedProps.set('app', undefined)
    this.states = new Map()
    this.currState = new InsertPoint(this.sharedProps)
    this.states.set('insertPoint', this.currState)
  }

  /**
     * Start to control the appl
     * @param {PIXI.Application} app the application of PIXI engine
     */
  injectApp (app:PIXI.Application) {
    this.sharedProps.set('app', app)
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
      const prevSatate = this.currState.name
      this.currState.exit(nextState)
      this.currState = this.states.get(nextState)!
      this.currState.enter(prevSatate)
    }
  };
}

/**
   * The class describes the state of editor when a point should be inserted
   */
class InsertPoint extends State {
  shapeCount: number;
  pointCount: number;
  app?: PIXI.Application;
  onClick: () => void;
  onClickHandler: () => void;
  /**
     * constructor of InsertPoint
     * @param {Map} sharedProps The properties will be used in every state.
     */
  constructor (sharedProps: Map<string, any>) {
    super(sharedProps)
    this.shapeCount = 0
    this.pointCount = 0
    this.onClick = function () {
      if (this.app === undefined) {
        return
      }
      const mousePos = this.app.renderer.plugins.interaction.mouse.global
      // TODO: Use command pattern
      // Create a root entity
      this.shapeCount++
      const newShape = new PIXI.Container()
      newShape.name = 'shape' + this.shapeCount
      const graphics = new PIXI.Graphics()
      graphics.name = 'point' + this.pointCount
      this.pointCount++
      // Draw a basic point
      graphics.lineStyle(0)
      graphics.beginFill(0xDE3249)
      graphics.drawCircle(mousePos.x, mousePos.y, 5)
      graphics.endFill()
      newShape.addChild(graphics)
      this.app.stage.addChild(newShape)
      this.sharedProps.set('lastPoint', new PIXI.Point(mousePos.x, mousePos.y))
    }
    this.onClickHandler = this.onClick.bind(this)
  }

  /**
     * Confirm there is a directly connect to next state
     * @param {string} nextState Notice the state which one is next.
     * @return {boolean} whether the state is able to jump to the next state.
     */
  allow (nextState: string) {
    // TODO: Use strategy pattern
    switch (nextState) {
      case 'Select':
        break
      default:
    }
    return false
  };

  /**
     * Callback when state starts
     * @param {string} _prevState Notice the state which state has been switched.
     */
  enter (prevState:string) {
    this.app = this.sharedProps.get('app')
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
      this.app.renderer.view.addEventListener('click', this.onClickHandler)
    }
  }
}
export {
  StateCtrl
}
