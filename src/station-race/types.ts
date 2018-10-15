// Game States

export type State = Begin | Setup | Turn | TurnResult | GameOver;
export type StateTag = State["tag"];

export interface Configuration {
  firstStation: number;
  lastStation: number;
  minPlayers: number;
  maxPlayers: number;
  makeSecretStation: (configuration: Configuration) => number;
  registeredPlayers: { [key: number]: string };
}

export interface Begin extends Configuration {
  tag: "Begin";
}

export interface Setup extends Configuration {
  tag: "Setup";
}

export interface Turn extends Configuration, Game {
  tag: "Turn";
}

export interface TurnResult extends Configuration, Game {
  tag: "TurnResult";
}

export interface GameOver extends Configuration {
  tag: "GameOver";
  winner: Player;
}

// Actions

export type Action =
  | SetupNewGame
  | Start
  | RegisterPlayer
  | GetOffTheTrain
  | GoLeft
  | GoRight
  | GoFirst
  | GoLast
  | NextTurn
  | PlayAgain
  | BeginAgain;

// https://github.com/reduxjs/redux/issues/186
// this is usually not a problem in redux, because
// reducers just ignore actions they don't know
// how to handle, but because here we want to
// have exhaustive checks over all action types,
// we need to exit early if the action is
// an internal redux action.
// ... and known actions can only be known actions

export type KnownAction = Action & {
  kind: "KnownAction";
};

export interface SetupNewGame {
  type: "SetupNewGame";
}

export interface RegisterPlayer {
  type: "RegisterPlayer";
  payload: PlayerRegistration;
}

export interface Start {
  type: "Start";
}

export interface GetOffTheTrain {
  type: "GetOffTheTrain";
}

export interface NextTurn {
  type: "NextTurn";
}

export interface GoLeft {
  type: "GoLeft";
}

export interface GoRight {
  type: "GoRight";
}

export interface GoFirst {
  type: "GoFirst";
}

export interface GoLast {
  type: "GoLast";
}

export interface PlayAgain {
  type: "PlayAgain";
}

export interface BeginAgain {
  type: "BeginAgain";
}
// Other types

export interface Game {
  currentPlayer: number;
  players: Player[];
  secretStation: number;
}

export interface Player {
  name: PlayerName;
  station: number;
}

export interface PlayerRegistration {
  i: number;
  name: PlayerName;
}

export type PlayerName = string;
