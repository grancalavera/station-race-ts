import * as R from "ramda";

// Main types

export type State = Begin | Setup | Turn | TurnResult | GameOver;

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

export type StateTag = State["tag"];
export type Transition<T extends State> = (state: T, input?: Action) => State;

// State guards

export const stateIs = <T extends State>(tags: StateTag[]) => (
  state: State
): state is T => R.any(tag => state.tag === tag, tags);

export const stateIsBegin = stateIs<Begin>(["Begin"]);
export const stateIsSetup = stateIs<Setup>(["Setup"]);
export const stateIsTurn = stateIs<Turn>(["Turn"]);
export const stateIsAnyTurn = stateIs<Turn | TurnResult>([
  "Turn",
  "TurnResult"
]);
export const stateIsTurnResult = stateIs<TurnResult>(["TurnResult"]);
export const stateIsGameOver = stateIs<GameOver>(["GameOver"]);

const stateIsNot = <T extends State>(tags: StateTag[]) => (
  state: State
): state is Exclude<State, T> => R.all(tag => tag !== state.tag, tags);

export const stateIsNotGameOver = stateIsNot<GameOver>(["GameOver"]);

// States

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

export interface Configuration {
  firstStation: number;
  lastStation: number;
  minPlayers: number;
  maxPlayers: number;
  makeSecretStation: (configuration: Configuration) => number;
  registeredPlayers: { [key: number]: string };
}

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

// Transitions

export const begin = (state: Configuration): Begin => ({
  ...state,
  tag: "Begin",

  registeredPlayers: {}
});

const setup = (state: Begin): Setup => ({
  ...state,
  tag: "Setup",

  registeredPlayers: R.range(0, state.maxPlayers).reduce(
    (reg, _, i) => ({
      ...reg,
      [i]: ""
    }),
    {}
  )
});

const start = (state: Setup): Setup | Turn =>
  hasEnoughPlayers(state) ? turn(state) : state;

const turn = (state: Setup): Turn => {
  return {
    ...state,
    tag: "Turn",

    currentPlayer: 0,
    players: R.values(state.registeredPlayers)
      .filter(Boolean)
      .map(name => ({
        name,
        station: state.firstStation
      })),
    secretStation: state.makeSecretStation(state)
  };
};

const getOffTheTrain = (state: Turn): GameOver | TurnResult =>
  isCurrentPlayerWinner(state) ? gameOver(state) : turnResult(state);

const gameOver = (state: Turn): GameOver => ({
  ...configuration(state),
  tag: "GameOver",

  winner: state.players[state.currentPlayer]!
});

const turnResult = (state: Turn): TurnResult => ({
  ...state,
  tag: "TurnResult"
});

const nextTurn = (state: TurnResult): Turn => ({
  ...state,
  tag: "Turn",

  currentPlayer: nextPlayer(state as Game)
});

const playAgain = (state: GameOver): Turn =>
  turn({
    ...configuration(state),
    tag: "Setup"
  });

const startAgain = (state: GameOver): Begin => begin(configuration(state));

// Transition identities

const registerPlayer = (state: Setup, input: RegisterPlayer): Setup => {
  const { i, name } = input.payload;
  return {
    ...state,
    registeredPlayers: {
      ...state.registeredPlayers,
      [i]: isInvalidName(name) ? "" : name
    }
  };
};

const withCurrentPlayer = (fn: (state: Turn, player: Player) => Player) => (
  state: Turn
): Turn => ({
  ...state,
  players: state.players.map(
    (player, i) => (i === state.currentPlayer ? fn(state, player) : player)
  )
});

const goLeft = withCurrentPlayer((state, player) => ({
  ...player,
  station:
    player.station > state.firstStation ? player.station - 1 : state.lastStation
}));

const goRight = withCurrentPlayer((state, player) => ({
  ...player,
  station:
    player.station < state.lastStation ? player.station + 1 : state.firstStation
}));

const goFirst = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.firstStation
}));

const goLast = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

// State machine

export const reducer = (state: State, action: KnownAction): State => {
  // if the kind isn't KnownAction, it means something
  // is sending us dodgy actions in runtime
  if (action.kind !== "KnownAction") {
    return state;
  }

  switch (action.type) {
    case "SetupNewGame":
      return stateIsBegin(state) ? setup(state) : state;
    case "RegisterPlayer":
      return stateIsSetup(state) ? registerPlayer(state, action) : state;
    case "Start":
      return stateIsSetup(state) ? start(state) : state;
    case "GoLeft":
      return stateIsTurn(state) ? goLeft(state) : state;
    case "GoRight":
      return stateIsTurn(state) ? goRight(state) : state;
    case "GoFirst":
      return stateIsTurn(state) ? goFirst(state) : state;
    case "GoLast":
      return stateIsTurn(state) ? goLast(state) : state;
    case "GetOffTheTrain":
      return stateIsTurn(state) ? getOffTheTrain(state) : state;
    case "NextTurn":
      return stateIsTurnResult(state) ? nextTurn(state) : state;
    case "PlayAgain":
      return stateIsGameOver(state) ? playAgain(state) : state;
    case "BeginAgain":
      return stateIsGameOver(state) ? startAgain(state) : state;
    default:
      return assertNever(action);
  }
};

// Utils

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

const configuration: (state: State) => Configuration = R.pick([
  "firstStation",
  "lastStation",
  "minPlayers",
  "maxPlayers",
  "makeSecretStation",
  "registeredPlayers"
]);

export const isCurrentPlayerWinner = (game: Game): boolean => game.players[game.currentPlayer].station === game.secretStation;

export const hasEnoughPlayers = (config: Configuration): boolean =>
  R.values(config.registeredPlayers).filter(Boolean).length >=
  config.minPlayers;

export const nextPlayer = (game: Game): number =>
  (game.currentPlayer + 1) % game.players.length;

export const isInvalidName = (name: PlayerName) => /^\s*$/.test(name);

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const makeSecretStation = ({
  firstStation,
  lastStation
}: Configuration) => randInt(firstStation, lastStation);

export const isCurrentPlayer = (game: Game, player: number): boolean =>
  game.currentPlayer === player;

export const currentPlayer = (game: Game) => game.players[game.currentPlayer];

export const stations = ({
  firstStation,
  lastStation
}: Configuration): number[] => R.range(firstStation, lastStation + 1);

// Action Creators

// https://github.com/reduxjs/redux/issues/186
// this is usually not a problem in redux, because
// reducers just ignore actions they don't know
// how to handle, but because here we want to
// have exhaustive checks over all action types,
// we need to exit early if the action is
// an internal redux action.
// ... and known actions can only be known actions
const acknowledge = (action: Action): KnownAction => ({
  ...action,
  kind: "KnownAction"
});

export const sendSetupNewGame = () => acknowledge({ type: "SetupNewGame" });
export const sendStart = () => acknowledge({ type: "Start" });
export const sendGetOffTheTrain = () => acknowledge({ type: "GetOffTheTrain" });
export const sendGoLeft = () => acknowledge({ type: "GoLeft" });
export const sendGoRight = () => acknowledge({ type: "GoRight" });
export const sendGoFirst = () => acknowledge({ type: "GoFirst" });
export const sendGoLast = () => acknowledge({ type: "GoLast" });
export const sendNextTurn = () => acknowledge({ type: "NextTurn" });
export const sendPlayAgain = () => acknowledge({ type: "PlayAgain" });
export const sendBeginAgain = () => acknowledge({ type: "BeginAgain" });
export const sendRegisterPlayer = (player: PlayerRegistration) =>
  acknowledge({
    payload: player,
    type: "RegisterPlayer"
  });
