import * as R from "ramda";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";

type State = Begin | Setup | Turn | TurnResult | GameOver;

type Input =
  | SetupNewGame
  | RegisterPlayer
  | Start
  | GoLeft
  | GoRight
  | GoFirst
  | GoLast
  | GetOffTheTrain
  | NextTurn
  | PlayAgain
  | BeginAgain;

// States

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

// Inputs

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

// Types

interface Configuration {
  firstStation: number;
  lastStation: number;
  minPlayers: number;
  maxPlayers: number;
  makeSecretStation: (configuration: Configuration) => number;
  registeredPlayers: { [key: number]: string };
}

interface Game {
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

// Transitions

const begin = (state: Configuration): Begin => ({
  ...state,
  tag: "Begin",

  registeredPlayers: {}
});

const setup = (state: Begin): Setup => ({
  ...state,
  tag: "Setup",

  registeredPlayers: [...Array(state.maxPlayers)].reduce(
    (reg, _, i) => ({
      ...reg,
      [i]: ""
    }),
    {}
  )
});

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

const turnResult = (state: Turn): TurnResult => ({
  ...state,
  tag: "TurnResult"
});

const nextTurn = (state: TurnResult): Turn => ({
  ...state,
  tag: "Turn",

  currentPlayer: nextPlayer(state as Game)
});

const gameOver = (state: Turn): GameOver => ({
  ...configuration(state),
  tag: "GameOver",

  winner: winner(state) as Player
});

const playAgain = (state: GameOver): Turn =>
  turn({
    ...configuration(state),
    tag: "Setup"
  });

const startAgain = (state: GameOver): Begin => begin(configuration(state));

// Transition identities

const registerPlayer = (
  { i, name }: PlayerRegistration,
  state: Setup
): Setup => ({
  ...state,
  registeredPlayers: {
    ...state.registeredPlayers,
    [i]: isInvalidName(name) ? "" : name
  }
});

const withCurrentPlayer = (fn: (state: Turn, player: Player) => Player) => (
  state: Turn
): Turn => ({
  ...state,
  players: state.players.map(
    (player, i) => (i === state.currentPlayer ? fn(state, player) : player)
  )
});

const goLeft = withCurrentPlayer(
  (state, player) =>
    player.station > state.firstStation
      ? { ...player, station: player.station - 1 }
      : player
);

const goRight = withCurrentPlayer(
  (state, player) =>
    player.station < state.lastStation
      ? { ...player, station: player.station + 1 }
      : player
);

const goFirst = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

const goLast = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

// State machine

const processInput = (state: State, input: Input): State => {
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

const configuration: (state: State) => Configuration = R.pick([
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

const isInvalidName = (name: PlayerName) => /^\s*$/.test(name);
const simulation = [
  { type: "SetupNewGame" },
  { type: "RegisterPlayer", payload: { i: 0, name: "Player 1" } },
  { type: "RegisterPlayer", payload: { i: 1, name: "Player 2" } },
  { type: "Start" },
  { type: "GoRight" },
  { type: "GetOffTheTrain" },
  { type: "NextTurn" },
  { type: "GoRight" },
  { type: "GoRight" },
  { type: "GetOffTheTrain" }
].reduce(
  (history, input: Input) => {
    const [state] = history;
    return [processInput(state, input), ...history];
  },
  [
    begin({
      firstStation: 1,
      lastStation: 4,
      makeSecretStation: () => 3,
      maxPlayers: 4,
      minPlayers: 2,
      registeredPlayers: {}
    })
  ]
);

// Etc

ReactDOM.render(
  <pre>{JSON.stringify(simulation, null, 2)}</pre>,
  document.getElementById("root") as HTMLElement
);
