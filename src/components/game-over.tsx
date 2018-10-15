import * as React from "react";
import { GameOver } from "src/internals";
import Keyboard from "./keyboard";

type GameOverPromptProps = GameOver & {
  onPlayAgain: () => void;
  onBeginAgain: () => void;
};

export default function GameOverPrompt(state: GameOverPromptProps) {
  const { onPlayAgain, onBeginAgain } = state;
  return (
    <React.Fragment>
      <Keyboard onEnter={onPlayAgain} onShiftEnter={onBeginAgain} />
      <h2>Game Over!</h2>
      <p>{state.winner.name} won the game.</p>
      <p>The secret station was station {state.winner.station}.</p>
      <div className="control-bar">
        <button
          className="control control-large"
          onClick={onPlayAgain}
          tabIndex={-1}
        >
          PLAY AGAIN
        </button>
        <button
          className="control control-large"
          onClick={onBeginAgain}
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
  );
}
