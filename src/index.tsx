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

type StateTag = State["tag"];
type Transition = (state: State, input?: Input) => State;

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
  hasWinner(state) ? gameOver(state) : turnResult(state);

const gameOver = (state: Turn): GameOver => ({
  ...configuration(state),
  tag: "GameOver",

  winner: winner(state) as Player
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

// State guards

const stateIs = <T extends State>(tag: StateTag) => (
  state: State
): state is T => {
  return state.tag === tag;
};

const stateIsBegin = stateIs<Begin>("Begin");
const stateIsSetup = stateIs<Setup>("Setup");
const stateIsTurn = stateIs<Turn>("Turn");
const stateIsTurnResult = stateIs<TurnResult>("TurnResult");
const stateIsGameOver = stateIs<GameOver>("GameOver");

const stateTransition = (guardFn: ((state: State) => state is State)) => (
  transFn: Transition,
  state: State,
  input?: Input
): State => (guardFn(state) ? transFn(state, input) : state);

const beginTransition = stateTransition(stateIsBegin);
const setupTransition = stateTransition(stateIsSetup);
const turnTransition = stateTransition(stateIsTurn);
const turnResultTransition = stateTransition(stateIsTurnResult);
const gameOverTransition = stateTransition(stateIsGameOver);

// State machine

const processInput = (state: State, input: Input): State => {
  switch (input.type) {
    case "SetupNewGame":
      return beginTransition(setup, state);
    case "RegisterPlayer":
      return setupTransition(registerPlayer, state, input);
    case "Start":
      return setupTransition(start, state);
    case "GoLeft":
      return turnTransition(goLeft, state);
    case "GoRight":
      return turnTransition(goRight, state);
    case "GoFirst":
      return turnTransition(goFirst, state);
    case "GoLast":
      return turnTransition(goLast, state);
    case "GetOffTheTrain":
      return turnTransition(getOffTheTrain, state);
    case "NextTurn":
      return turnResultTransition(nextTurn, state);
    case "PlayAgain":
      return gameOverTransition(playAgain, state);
    case "BeginAgain":
      return gameOverTransition(startAgain, state);
    default:
      return input;
  }
};

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
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const makeSecretStation = ({ firstStation, lastStation }: Configuration) =>
  randInt(firstStation, lastStation);

// UI

interface KeyboardProps {
  onLeft?: () => void;
  onRight?: () => void;
  onShiftLeft?: () => void;
  onShiftRight?: () => void;
  onEnter?: () => void;
  onShiftEnter?: () => void;
}

class Keyboard extends React.Component<KeyboardProps> {
  public static defaultProps: KeyboardProps = {
    onEnter: () => {},
    onLeft: () => {},
    onRight: () => {},
    onShiftEnter: () => {},
    onShiftLeft: () => {},
    onShiftRight: () => {}
  };

  constructor(props: KeyboardProps) {
    super(props);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  public handleKeydown(e: KeyboardEvent): void {
    const { shiftKey, key } = e;
    const {
      onEnter,
      onLeft,
      onRight,
      onShiftEnter,
      onShiftLeft,
      onShiftRight
    } = this.props;

    switch (shiftKey ? `Shift${key}` : key) {
      case "ArrowLeft":
        e.preventDefault();
        onLeft!();
        break;
      case "ArrowRight":
        e.preventDefault();
        onRight!();
        break;
      case "ShiftArrowLeft":
        e.preventDefault();
        onShiftLeft!();
        break;
      case "ShiftArrowRight":
        e.preventDefault();
        onShiftRight!();
        break;
      case "Enter":
        e.preventDefault();
        onEnter!();
        break;
      case "ShiftEnter":
        e.preventDefault();
        onShiftEnter!();
        break;
      default:
    }
  }

  public render() {
    return null;
  }

  public componentDidMount() {
    document.addEventListener("keydown", this.handleKeydown);
  }

  public componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeydown);
  }
}

class StationRace extends React.Component<Configuration, State> {
  constructor(props: Configuration) {
    super(props);
    this.state = begin(props);
    this.setupNewGame = this.setupNewGame.bind(this);
  }
  public render() {
    const state = this.state;
    return (
      <React.Fragment>
        <h1>Station Race!</h1>

        {this.whenStateIsNot("GameOver") && (
          <blockquote>
            Get off the train at the secret station to win the game.
          </blockquote>
        )}

        {state.tag === "Begin" && (
          <React.Fragment>
            <Keyboard onEnter={this.setupNewGame} />
            <ul>
              <li>
                You're in a train running from station {state.firstStation} to
                station {state.lastStation}.
              </li>
              <li>
                There is a secret station and you need to get off the train
                there.
              </li>
              <li>
                Be the first one to guess the secret station and win the game!
              </li>
            </ul>
            <div className="control-bar">
              <button
                className="control control-large"
                onClick={this.setupNewGame}
                tabIndex={-1}
              >
                BEGIN
              </button>
            </div>
            <ul className="small-print">
              <li>Enter: begin the game.</li>
            </ul>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  private sendInput(input: Input): void {
    const addedState = processInput(this.state, input);
    const newKeys = Object.keys(addedState);
    const remainingState = Object.keys(this.state).reduce(
      (rm, key) =>
        !R.contains(key, newKeys) ? { ...rm, [key]: undefined } : rm,
      {}
    );
    this.setState({ ...remainingState, ...addedState });
  }

  private setupNewGame(): void {
    this.sendInput({ type: "SetupNewGame" });
  }

  // private beginAgain(): void {
  //   this.sendInput({ type: "BeginAgain" });
  // }

  // private start(): void {
  //   this.sendInput({ type: "Start" });
  // }

  // private playAgain(): void {
  //   this.sendInput({ type: "PlayAgain" });
  // }

  // private getOffTheTrain(): void {
  //   this.sendInput({ type: "GetOffTheTrain" });
  // }

  // private nextTurn(): void {
  //   this.sendInput({ type: "NextTurn" });
  // }

  // private goLeft(): void {
  //   this.sendInput({ type: "GoLeft" });
  // }

  // private goRight(): void {
  //   this.sendInput({ type: "GoRight" });
  // }

  // private goFirst(): void {
  //   this.sendInput({ type: "GoFirst" });
  // }

  // private goLast(): void {
  //   this.sendInput({ type: "GoLast" });
  // }

  // private registerPlayer(registration: PlayerRegistration): void {
  //   this.sendInput({ type: "RegisterPlayer", payload: registration });
  // }

  private whenStateIs(tag: StateTag): boolean {
    return this.state.tag === tag;
  }

  private whenStateIsNot(tag: StateTag): boolean {
    return !this.whenStateIs(tag);
  }

  // private isCurrentPlayer(game: Game, player: number): boolean {
  //   return game.currentPlayer === player;
  // }
}

// Simulation

ReactDOM.render(
  <React.Fragment>
    <StationRace
      firstStation={1}
      lastStation={7}
      minPlayers={2}
      maxPlayers={4}
      makeSecretStation={makeSecretStation}
      registeredPlayers={{}}
    />
  </React.Fragment>,
  document.getElementById("root") as HTMLElement
);
