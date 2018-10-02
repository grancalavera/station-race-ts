import * as R from "ramda";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";

export type State = Begin | Setup | Turn | TurnResult | GameOver;

export type Input =
  | SetupNewGame
  | RegisterPlayer
  | Start
  | GetOffTheTrain
  | NextTurn
  | GoLeft
  | GoRight
  | GoFirst
  | GoLast
  | PlayAgain
  | BeginAgain;

interface Begin extends Configuration {
  tag: "Begin";
}

interface Setup extends Configuration {
  tag: "Setup";
}

interface Turn extends Configuration, Game {
  tag: "Turn";
}

interface TurnResult extends Configuration, Game {
  tag: "TurnResult";
}

interface GameOver extends Configuration {
  tag: "GameOver";
  winner: Player;
}

interface SetupNewGame {
  type: "SetupNewGame";
}

interface RegisterPlayer {
  type: "RegisterPlayer";
  payload: PlayerRegistration;
}

interface Start {
  type: "Start";
}

interface GetOffTheTrain {
  type: "GetOffTheTrain";
}

interface NextTurn {
  type: "NextTurn";
}

interface GoLeft {
  type: "GoLeft";
}

interface GoRight {
  type: "GoRight";
}

interface GoFirst {
  type: "GoFirst";
}

interface GoLast {
  type: "GoLast";
}

interface PlayAgain {
  type: "PlayAgain";
}

interface BeginAgain {
  type: "BeginAgain";
}

interface Configuration {
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

interface Player {
  name: PlayerName;
  station: number;
}

interface PlayerRegistration {
  i: number;
  name: PlayerName;
}

type PlayerName = string;

// State Transitions

const begin = (state: Configuration): Begin => ({
  ...state,
  tag: "Begin"
});

const setup = (state: Begin): Setup => ({
  ...state,
  tag: "Setup",

  registeredPlayers: [...Array(state.maxPlayers)].reduce((reg, _, i) => ({
    ...reg,
    [i]: ""
  }))
});

const turn = (state: Setup): Turn => ({
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
});

export const turnResult = (state: Turn): TurnResult => ({
  ...state,
  tag: "TurnResult"
});

export const nextTurn = (state: TurnResult): Turn => ({
  ...state,
  tag: "Turn",

  currentPlayer: nextPlayer(state as Game)
});

export const gameOver = (state: Turn): GameOver => ({
  ...configuration(state),
  tag: "GameOver",

  winner: winner(state) as Player
});

export const playAgain = (state: GameOver): Turn =>
  turn({
    ...configuration(state),
    tag: "Setup"
  });

export const startAgain = (state: GameOver): Begin =>
  begin(configuration(state));

// State Identities

export const registerPlayer = (
  { i, name }: PlayerRegistration,
  state: Setup
): Setup => {
  const invalidName = /^\s*$/.test(name);
  return {
    ...state,
    registeredPlayers: {
      ...state.registeredPlayers,
      [i]: invalidName ? "" : name
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

export const goLeft = withCurrentPlayer(
  (state, player) =>
    player.station > state.firstStation
      ? { ...player, station: player.station - 1 }
      : player
);

export const goRight = withCurrentPlayer(
  (state, player) =>
    player.station < state.lastStation
      ? { ...player, station: player.station + 1 }
      : player
);

export const goFirst = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

export const goLast = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

// State Machine

export const processInput = (state: State, input: Input): State => {
  switch (input.type) {
    case "SetupNewGame":
      return setup(state as Begin);
    case "RegisterPlayer":
      return registerPlayer(input.payload, state as Setup);
    case "Start":
      return hasEnoughPlayers(state) ? turn(state as Setup) : state;
    case "GoLeft":
      return goLeft(state as Turn);
    case "GoRight":
      return goRight(state as Turn);
    case "GoFirst":
      return goFirst(state as Turn);
    case "GoLast":
      return goLast(state as Turn);
    case "GetOffTheTrain":
      return hasWinner(state as Game)
        ? gameOver(state as Turn)
        : turnResult(state as Turn);
    case "NextTurn":
      return nextTurn(state as TurnResult);
    case "PlayAgain":
      return playAgain(state as GameOver);
    case "BeginAgain":
      return startAgain(state as GameOver);
    default:
      return assertNever(input);
  }
};

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export const configuration: (state: State) => Configuration = R.pick([
  "firstStation",
  "lastStation",
  "minPlayers",
  "maxPlayers",
  "makeSecretStation",
  "registeredPlayers"
]);

const winner = (game: Game): Player | undefined =>
  game.players.find(player => player.station === game.secretStation);

const hasWinner = (game: Game): boolean => !!winner(game);

const hasEnoughPlayers = (config: Configuration): boolean =>
  R.values(config.registeredPlayers).filter(Boolean).length >=
  config.minPlayers;

const nextPlayer = (game: Game): number =>
  (game.currentPlayer + 1) % game.players.length;

// Etc

ReactDOM.render(<div>Nothing</div>, document.getElementById(
  "root"
) as HTMLElement);

// look at this at some point
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#making-a-progressive-web-app
registerServiceWorker();
