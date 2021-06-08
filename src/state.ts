import { Context } from './context'
/**
   * The class describes the state of the editor
   */
class State {
  name: any;
  context: Context;
  /**
     * constructor of InsertPoint
     * @param {Context} context The properties will be used in every state.
     */
  constructor (context: Context) {
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
export {
  State
}
