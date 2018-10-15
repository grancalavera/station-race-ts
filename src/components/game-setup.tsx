import * as R from "ramda";
import * as React from "react";
import { hasEnoughPlayers, PlayerRegistration, Setup } from "src/station-race";
import Keyboard from "./keyboard";

type GameSetupProps = Setup & {
  onStart: () => void;
  onRegisterPlayer: (player: PlayerRegistration) => void;
};

export default function GameSetup(state: GameSetupProps) {
  const { onStart, onRegisterPlayer } = state;
  const handleOnChange = (i: number) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    onRegisterPlayer({ i, name: e.target.value });
  };
  return (
    <React.Fragment>
      <Keyboard onEnter={onStart} />
      <ul>
        <li>Add at least {state.minPlayers} players to start the game.</li>
        <li>You can add up to {state.maxPlayers} players.</li>
      </ul>
      {R.range(0, state.maxPlayers).map((_, i) => (
        <div key={i} className="editor">
          <input
            value={state.registeredPlayers[i] ? state.registeredPlayers[i] : ""}
            onChange={handleOnChange(i)}
          />{" "}
        </div>
      ))}

      {hasEnoughPlayers(state) && (
        <div className="control-bar">
          <button
            className="control control-large"
            onClick={onStart}
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
  );
}
