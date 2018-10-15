import * as React from "react";
import { State, stateIsNotGameOver } from "src/station-race";

export default function Header(state: State) {
  return (
    <React.Fragment>
      <h1>Station Race!</h1>

      {stateIsNotGameOver(state) && (
        <blockquote>
          Get off the train at the secret station to win the game.
        </blockquote>
      )}
    </React.Fragment>
  );
}
