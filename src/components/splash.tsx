import * as React from "react";
import { Begin } from "src/station-race";
import Keyboard from "./keyboard";

type SplashProps = Begin & { onSetupNewGame: () => void };

export default function Splash(state: SplashProps) {
  const { onSetupNewGame } = state;
  return (
    <React.Fragment>
      <Keyboard onEnter={onSetupNewGame} />
      <ul>
        <li>
          You're in a train running from station {state.firstStation} to station{" "}
          {state.lastStation}.
        </li>
        <li>
          There is a secret station and you need to get off the train there.
        </li>
        <li>Be the first one to guess the secret station and win the game!</li>
      </ul>
      <div className="control-bar">
        <button
          className="control control-large"
          onClick={onSetupNewGame}
          tabIndex={-1}
        >
          BEGIN
        </button>
      </div>
      <ul className="small-print">
        <li>Enter: begin the game.</li>
      </ul>
    </React.Fragment>
  );
}
