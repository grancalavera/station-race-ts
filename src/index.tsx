import * as R from "ramda";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";

// Main types

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
  station: state.firstStation
}));

const goLast = withCurrentPlayer((state, player) => ({
  ...player,
  station: state.lastStation
}));

// State guards

const stateIs = <T extends State>(tags: StateTag[]) => (
  state: State
): state is T => {
  return R.any(tag => state.tag === tag, tags);
};

const stateIsNot = <T extends State>(tag: StateTag) => (
  state: State
): state is Exclude<State, T> => state.tag !== tag;

const stateTransition = <T extends State>(
  guardFn: ((state: State) => state is T)
) => (transFn: Transition, state: State, input?: Input): State =>
  guardFn(state) ? transFn(state, input) : state;

const stateIsBegin = stateIs<Begin>(["Begin"]);
const stateIsSetup = stateIs<Setup>(["Setup"]);
const stateIsTurn = stateIs<Turn>(["Turn"]);
const stateIsAnyTurn = stateIs<Turn | TurnResult>(["Turn", "TurnResult"]);
const stateIsTurnResult = stateIs<TurnResult>(["TurnResult"]);
const stateIsGameOver = stateIs<GameOver>(["GameOver"]);

const stateIsNotGameOver = stateIsNot<GameOver>("GameOver");

const beginTransition = stateTransition<Begin>(stateIsBegin);
const setupTransition = stateTransition<Setup>(stateIsSetup);
const turnTransition = stateTransition<Turn>(stateIsTurn);
const turnResultTransition = stateTransition<TurnResult>(stateIsTurnResult);
const gameOverTransition = stateTransition<GameOver>(stateIsGameOver);

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

// Utils

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

const isCurrentPlayer = (game: Game, player: number): boolean =>
  game.currentPlayer === player;

const currentPlayer = (game: Game) => game.players[game.currentPlayer];

const stations = ({ firstStation, lastStation }: Configuration): number[] =>
  R.range(firstStation, lastStation + 1);

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
    this.start = this.start.bind(this);
    this.registerPlayer = this.registerPlayer.bind(this);
    this.getOffTheTrain = this.getOffTheTrain.bind(this);
    this.goLeft = this.goLeft.bind(this);
    this.goRight = this.goRight.bind(this);
    this.goFirst = this.goFirst.bind(this);
    this.goLast = this.goLast.bind(this);
    this.nextTurn = this.nextTurn.bind(this);
    this.playAgain = this.playAgain.bind(this);
    this.beginAgain = this.beginAgain.bind(this);
  }

  public render() {
    const state = this.state;
    return (
      <React.Fragment>
        <h1>Station Race!</h1>

        {stateIsNotGameOver(state) && (
          <blockquote>
            Get off the train at the secret station to win the game.
          </blockquote>
        )}

        {stateIsBegin(state) && (
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

        {stateIsSetup(state) && (
          <React.Fragment>
            <Keyboard onEnter={this.start} />
            <ul>
              <li>
                Add at least {state.minPlayers} players to start the game.
              </li>
              <li>You can add up to {state.maxPlayers} players.</li>
            </ul>
            {R.range(0, state.maxPlayers).map((_, i) => (
              <div key={i} className="editor">
                <input
                  value={
                    state.registeredPlayers[i] ? state.registeredPlayers[i] : ""
                  }
                  onChange={this.registerPlayer(i)}
                />{" "}
              </div>
            ))}

            {hasEnoughPlayers(state) && (
              <div className="control-bar">
                <button
                  className="control control-large"
                  onClick={this.start}
                  tabIndex={-1}
                >
                  START
                </button>
              </div>
            )}
            <ul className="small-print">
              {hasEnoughPlayers(state) && <li>Enter: start game.</li>}
            </ul>
          </React.Fragment>
        )}

        {stateIsAnyTurn(state) && (
          <React.Fragment>
            {stateIsTurn(state) ? (
              <Keyboard
                onEnter={this.getOffTheTrain}
                onLeft={this.goLeft}
                onRight={this.goRight}
                onShiftLeft={this.goFirst}
                onShiftRight={this.goLast}
              />
            ) : (
              <Keyboard onEnter={this.nextTurn} />
            )}

            {state.players.map(({ name, station }, i) => (
              <div
                key={i}
                className={
                  isCurrentPlayer(state, i) ? "player player-current" : "player"
                }
              >
                <p>
                  {name} is at as station {station}
                </p>
                <div className="stations">
                  {stations(state).map(someStation => (
                    <code
                      key={"station" + someStation}
                      className={
                        station === someStation
                          ? "station station-current"
                          : "station"
                      }
                    >
                      {someStation}
                      :[
                      {station === someStation ? "X" : " "}]
                    </code>
                  ))}
                </div>

                {stateIsTurn(state) &&
                  isCurrentPlayer(state, i) && (
                    <div className="control-bar">
                      <button
                        onClick={this.goFirst}
                        className="control"
                        tabIndex={-1}
                      >
                        {"<<"}
                      </button>
                      <button
                        onClick={this.goLeft}
                        className="control"
                        tabIndex={-1}
                      >
                        {"<"}
                      </button>
                      <button
                        onClick={this.goRight}
                        className="control"
                        tabIndex={-1}
                      >
                        {">"}
                      </button>
                      <button
                        onClick={this.goLast}
                        className="control"
                        tabIndex={-1}
                      >
                        {">>"}
                      </button>
                      <button
                        onClick={this.getOffTheTrain}
                        className="control control-large"
                        tabIndex={-1}
                      >
                        GET OFF THE TRAIN!
                      </button>
                    </div>
                  )}
                {stateIsTurnResult(state) &&
                  isCurrentPlayer(state, i) && (
                    <React.Fragment>
                      <p className="error">
                        {currentPlayer(state).station < state.secretStation
                          ? "You got off the grain too early!"
                          : "You got off the train too late!"}
                      </p>
                      <div className="control-bar">
                        <button
                          className="control control-large"
                          onClick={this.nextTurn}
                        >
                          NEXT PLAYER
                        </button>
                      </div>
                    </React.Fragment>
                  )}
              </div>
            ))}
            <ul className="small-print">
              {stateIsTurn(state) ? (
                <React.Fragment>
                  <li>LeftArrow: go to previous station.</li>
                  <li>RightArrow: go to getOffTheTrain station.</li>
                  <li>Shift+LeftArrow: go to goFirst station.</li>
                  <li>Shift+RightArrow: go to goLast station.</li>
                  <li>Enter: get off the train.</li>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <li>Enter: Next player.</li>
                </React.Fragment>
              )}
            </ul>
          </React.Fragment>
        )}

        {stateIsGameOver(state) && (
          <React.Fragment>
            <Keyboard onEnter={this.playAgain} onShiftEnter={this.beginAgain} />
            <h2>Game Over!</h2>
            <p>{state.winner.name} won the game.</p>
            <p>The secret station was station {state.winner.station}.</p>
            <div className="control-bar">
              <button
                className="control control-large"
                onClick={this.playAgain}
                tabIndex={-1}
              >
                PLAY AGAIN
              </button>
              <button
                className="control control-large"
                onClick={this.beginAgain}
                tabIndex={-1}
              >
                NEW GAME
              </button>
            </div>
            <ul className="small-print">
              <li>Enter: play playAgain.</li>
              <li>Shift+Enter: play a new game.</li>
            </ul>
          </React.Fragment>
        )}
        <pre>{JSON.stringify(state, null, 2)}</pre>
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

  private start(): void {
    this.sendInput({ type: "Start" });
  }

  private registerPlayer(i: number) {
    return (e: React.ChangeEvent<HTMLInputElement>): void => {
      e.preventDefault();
      this.sendInput({
        payload: { i, name: e.target.value },
        type: "RegisterPlayer"
      });
    };
  }

  private getOffTheTrain(): void {
    this.sendInput({ type: "GetOffTheTrain" });
  }

  private goLeft(): void {
    this.sendInput({ type: "GoLeft" });
  }

  private goRight(): void {
    this.sendInput({ type: "GoRight" });
  }

  private goFirst(): void {
    this.sendInput({ type: "GoFirst" });
  }

  private goLast(): void {
    this.sendInput({ type: "GoLast" });
  }

  private nextTurn(): void {
    this.sendInput({ type: "NextTurn" });
  }

  private playAgain(): void {
    this.sendInput({ type: "PlayAgain" });
  }

  private beginAgain(): void {
    this.sendInput({ type: "BeginAgain" });
  }
}

// Application

ReactDOM.render(
  <StationRace
    firstStation={1}
    lastStation={7}
    minPlayers={2}
    maxPlayers={4}
    makeSecretStation={makeSecretStation}
    registeredPlayers={{}}
  />,
  document.getElementById("root") as HTMLElement
);
