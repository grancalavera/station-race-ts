import { connect } from "react-redux";
import {
  Begin,
  GameOver,
  sendBeginAgain,
  sendGetOffTheTrain,
  sendGoFirst,
  sendGoLast,
  sendGoLeft,
  sendGoRight,
  sendNextTurn,
  sendPlayAgain,
  sendRegisterPlayer,
  sendSetupNewGame,
  sendStart,
  Setup,
  State,
  Turn,
  TurnResult
} from "src/station-race";
import { default as GameComponent } from "./game";
import { default as GameOverComponent } from "./game-over";
import { default as GameSetupComponent } from "./game-setup";
import { default as HeaderComponent } from "./header";
import { default as SplashComponent } from "./splash";

export const Header = connect((state: State) => state)(HeaderComponent);

export const Splash = connect(
  (state: Begin) => state,
  { onSetupNewGame: sendSetupNewGame }
)(SplashComponent);

export const GameSetup = connect(
  (state: Setup) => state,
  {
    onRegisterPlayer: sendRegisterPlayer,
    onStart: sendStart
  }
)(GameSetupComponent);

export const Game = connect(
  (state: Turn | TurnResult) => state,
  {
    onGetOffTheTrain: sendGetOffTheTrain,
    onGoFirst: sendGoFirst,
    onGoLast: sendGoLast,
    onGoLeft: sendGoLeft,
    onGoRight: sendGoRight,
    onNextTurn: sendNextTurn
  }
)(GameComponent);

export const GameOverPrompt = connect(
  (state: GameOver) => state,
  {
    onBeginAgain: sendBeginAgain,
    onPlayAgain: sendPlayAgain
  }
)(GameOverComponent);
