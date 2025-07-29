import { Actions } from "./actions";

export interface ActionProvider {
  /**
   * Register actions with the Actions instance
   * This method should be called by agents to register their own actions
   */
  registerActions(actions: Actions): void;
}
