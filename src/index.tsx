import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

export type Input = InputSimple | InputRegister;
export type State = Begin | Setup | Turn | TurnResult | Over;

interface InputSimple {
  type:
    | "start"
    | "setup"
    | "getoff"
    | "next"
    | "left"
    | "right"
    | "first"
    | "last"
    | "rematch"
    | "restart";
}

interface InputRegister {
  type: "register player";
  name: string;
}

interface Configuration {
  firstStation: number;
  lastStation: number;
  minPlayers: number;
  maxPlayers: number;
  makeSecretStation: (configuration: Configuration) => number;
}

interface PlayerRegisry {
  registeredPlayers: { [key: number]: string | null };
}

interface Player {
  name: string;
  station: number;
}

interface Game {
  players: [Player];
  currentPlayer: number;
  secretStation: number;
}

interface GameOver {
  winner: Player;
}

interface Begin extends Configuration {
  tag: "begin";
}

interface Setup extends Configuration, PlayerRegisry {
  tag: "setup";
}

interface Turn extends Configuration, PlayerRegisry, Game {
  tag: "turn";
}

interface TurnResult extends Configuration, PlayerRegisry, Game {
  tag: "result";
}

interface Over extends Configuration, PlayerRegisry, GameOver {
  tag: "over";
}

export type ToBegin = (x: Configuration) => Begin;
export type ToSetup = (x: Configuration) => Setup;
export type ToTurn = (x: Configuration & PlayerRegisry) => Turn;
export type ToTurnResult = (
  x: Configuration & PlayerRegisry & Game
) => TurnResult;
export type ToOver = (x: Configuration & PlayerRegisry & Game) => Over;

ReactDOM.render(<div>Nothing</div>, document.getElementById(
  "root"
) as HTMLElement);

// look at this at some point
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#making-a-progressive-web-app
registerServiceWorker();
