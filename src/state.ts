
import * as PIXI from 'pixi.js'
/**
   * The class describes the state of the editor
   */
class State {
  name: any;
  context: Map<string, any>;
  /**
     * constructor of InsertPoint
     * @param {Map} context The properties will be used in every state.
     */
  constructor (context: Map<string, any>) {
    this.context = context
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
  context: Map<string, any>;
  states: Map<string, State>
  currState: State;
  /**
       * constructor of StateCtrl
       */
  constructor () {
    // Settle the context for manipulation.
    this.context = new Map()
    this.context.set('controller', this)
    this.context.set('app', undefined)
    this.context.set('numPoint', 0)
    this.context.set('numShape', 0)
    // Create all state in advance.
    this.states = new Map()
    this.currState = new InsertPoint(this.context)
    this.states.set('insertPoint', this.currState)
    this.states.set('insertLine', new InsertLine(this.context))
  }

  /**
     * Start to control the appl
     * @param {PIXI.Application} app the application of PIXI engine
     */
  injectApp (app:PIXI.Application) {
    this.context.set('app', app)
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
      const numPoint = this.context.get('numPoint')
      const numShape = this.context.get('numShape')
      const newShape = new PIXI.Container()
      newShape.name = 'shape' + numShape
      this.context.set('numShape', numShape + 1)
      const graphics = new PIXI.Graphics()
      graphics.name = 'point' + numPoint
      this.context.set('numPoint', numPoint + 1)
      // Draw a basic point
      graphics.lineStyle(0)
      graphics.beginFill(0xDE3249)
      graphics.drawCircle(mousePos.x, mousePos.y, 5)
      graphics.endFill()
      graphics.cacheAsBitmap = true
      newShape.addChild(graphics)
      this.app.stage.addChild(newShape)
      this.context.set('lastPoint', new PIXI.Point(mousePos.x, mousePos.y))
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

/**
   * The class describes the state of editor when a line should be inserted
   */
class InsertLine extends State {
  app?: PIXI.Application;
  helpLine? : PIXI.Graphics;
  onClick: () => void;
  onClickHandler: () => void;
  onUpdate: () => void;
  onUpdateHandler: () => void;
  onKeyUp: (e: KeyboardEvent) => void;
  onKeyUpHandler: (e: KeyboardEvent) => void;

  /**
     * constructor of InsertPoint
     * @param {Map} context The properties will be used in every state.
     */
  constructor (context: Map<string, any>) {
    super(context)
    this.onKeyUp = function (e:KeyboardEvent) {
      if (e.defaultPrevented) {
        return
      }
      if (e.key === 'Esc' || e.key === 'Escape') {
        const ctrl:StateCtrl = this.context.get('controller')!
        ctrl.change('insertPoint')
      }
    }
    this.onClick = function () {
    }
    this.onUpdate = function () {
      if (this.app !== undefined) {
        const helpLine = this.helpLine!
        const lastPoint = this.context.get('lastPoint')
        const mousePos = this.app.renderer.plugins.interaction.mouse.global
        helpLine.clear()
        helpLine.lineStyle(10, 0xff0000, 0.8, 1, true)
        helpLine.moveTo(lastPoint.x, lastPoint.y)
        helpLine.lineTo(mousePos.x, mousePos.y)
      }
    }
    this.onKeyUpHandler = this.onKeyUp.bind(this)
    this.onClickHandler = this.onClick.bind(this)
    this.onUpdateHandler = this.onUpdate.bind(this)
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
      if (this.helpLine === undefined) {
        this.helpLine = new PIXI.Graphics()
        this.app.stage.addChild(this.helpLine)
      } else {
        this.helpLine.clear()
      }
      this.app.ticker.add(this.onUpdateHandler)
      window.addEventListener('keyup', this.onKeyUpHandler)
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
      window.removeEventListener('keyup', this.onKeyUpHandler)
    }
  }
}
export {
  StateCtrl
}
