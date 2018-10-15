import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Action, createStore } from "redux";
import { default as StationRace } from "./app";
import "./index.css";
import { begin, makeSecretStation, reducer, State } from "./internals";

const store = createStore<State, Action, any, any>(
  reducer,
  begin({
    firstStation: 1,
    lastStation: 7,
    makeSecretStation,
    maxPlayers: 4,
    minPlayers: 2,
    registeredPlayers: {}
  })
);

ReactDOM.render(
  <Provider store={store}>
    <StationRace />
  </Provider>,
  document.getElementById("root") as HTMLElement
);
