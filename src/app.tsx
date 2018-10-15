import * as React from "react";
import { connect } from "react-redux";
import { Game, GameOverPrompt, GameSetup, Header, Splash } from "./components";
import {
  State,
  stateIsAnyTurn,
  stateIsBegin,
  stateIsGameOver,
  stateIsSetup
} from "./internals";

const StationRace = (state: State) => (
  <React.Fragment>
    <Header />
    {stateIsBegin(state) && <Splash />}
    {stateIsSetup(state) && <GameSetup />}
    {stateIsAnyTurn(state) && <Game />}
    {stateIsGameOver(state) && <GameOverPrompt />}
    <pre>{JSON.stringify(state, null, 2)}</pre>
  </React.Fragment>
);

export default connect((state: State) => state)(StationRace);
