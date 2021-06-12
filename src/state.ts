import { Context } from './context'
export type ConcreteState = 'None' | 'Basic' | 'EditPath' | 'ClosePath' | 'Seleted'
/**
   * The class describes the state of the editor
   */
export abstract class State {
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
  abstract allow (nextState:ConcreteState): boolean;

  /**
     * Callback when state starts
     * @param {string} prevState Notice the state which state has been switched.
     */
   abstract enter (prevState:ConcreteState): void;
  /**
     * Callback when state exit
     * @param {string} nextState Notice the state which one is next.
     */
  abstract exit (nextState:ConcreteState): void;
}
