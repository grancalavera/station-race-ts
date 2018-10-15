import * as React from "react";
import {
  currentPlayer,
  isCurrentPlayer,
  stateIsTurn,
  stateIsTurnResult,
  stations,
  Turn,
  TurnResult
} from "src/station-race";
import Keyboard from "./keyboard";

type GameProps = (Turn | TurnResult) & {
  onGetOffTheTrain: () => void;
  onGoLeft: () => void;
  onGoRight: () => void;
  onGoFirst: () => void;
  onGoLast: () => void;
  onNextTurn: () => void;
};

export default function Game(state: GameProps) {
  const {
    onGetOffTheTrain,
    onGoFirst,
    onGoLast,
    onGoLeft,
    onGoRight,
    onNextTurn
  } = state;
  return (
    <React.Fragment>
      {stateIsTurn(state) ? (
        <Keyboard
          onEnter={onGetOffTheTrain}
          onLeft={onGoLeft}
          onRight={onGoRight}
          onShiftLeft={onGoFirst}
          onShiftRight={onGoLast}
        />
      ) : (
        <Keyboard onEnter={onNextTurn} />
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
                <button onClick={onGoFirst} className="control" tabIndex={-1}>
                  {"<<"}
                </button>
                <button onClick={onGoLeft} className="control" tabIndex={-1}>
                  {"<"}
                </button>
                <button onClick={onGoRight} className="control" tabIndex={-1}>
                  {">"}
                </button>
                <button onClick={onGoLast} className="control" tabIndex={-1}>
                  {">>"}
                </button>
                <button
                  onClick={onGetOffTheTrain}
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
                    onClick={onNextTurn}
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
  );
}
