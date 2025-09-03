import { useEffect, useState } from "react";
import { Board } from "../components/Chessboard";
import { useSocket } from "../hooks/useSocket";
import "../index.css";
import { Chess } from "chess.js";

type MoveRecord = {
  moveNumber: number;
  white?: string;
  black?: string;
};


const INIT_GAME = "init-game";
const MOVE = "move";
const GAME_OVER = "game_over";

export const Game = () => {
  const socket = useSocket();
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [gameStatus, setGameStatus] = useState("waiting");
  const [playerColor, setPlayerColor] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
const [moves, setMoves] = useState<MoveRecord[]>([]);
 // Move history

const getFormattedMoves = () => {
  const formatted = [];
  for (let i = 0; i < moves.length; i += 2) {
    formatted.push({
      moveNumber: i / 2 + 1,
      white: moves[i] || "",
      black: moves[i + 1] || "",
    });
  }
  return formatted;
};

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log("Game component received message:", message);

      switch (message.type) {
        case "CONNECTION_ESTABLISHED":
          console.log("Connected to server");
          break;

        case "WAITING_FOR_OPPONENT":
          setGameStatus("waiting for opponent");
          break;

        case "INIT_GAME":
          setPlayerColor(message.payload.color);
          setGameStatus("playing");
          setBoard(chess.board());
          break;

        case MOVE: {
          const moveData = message.payload.move || message.payload;
          try {
            const result = chess.move({
              from: moveData.from,
              to: moveData.to,
            });
// todo storing data

            if (result) {
              if (message.payload.board) {
                chess.load(message.payload.board);
              }
              setBoard([...chess.board()]);
             setMoves((prevMoves) => {
              const lastRow = prevMoves[prevMoves.length - 1];
              const isWhiteMove = result.color === "w";
              if (isWhiteMove) {
                // White's move → always push a new row
                return [
                  ...prevMoves,
                  { moveNumber: prevMoves.length + 1, white: result.san },
                ];
              } else {
                // Black's move → update last row
                if (lastRow) {
                  const updated = [...prevMoves];
                  updated[updated.length - 1] = {
                    ...lastRow,
                    black: result.san,
                  };
                  return updated;
                }
                return prevMoves; // safeguard
              }
            });
              if (chess.isCheck() && !chess.isCheckmate()) {
                setGameStatus(
                  `${chess.turn() === "w" ? "White" : "Black"} is in check!`
                );
              } else {
                setGameStatus("playing");
              }
            }
          } catch (error) {
            console.error("Error making move:", error);
          }
          break;
        }

        case GAME_OVER: {
          const { result, winner, fen } = message.payload;
          if (fen) {
            chess.load(fen);
            setBoard([...chess.board()]);
          }
          setResult(result);
          setWinner(winner);

          if (result === "checkmate") {
            setGameStatus(`Game over - Checkmate! ${winner} wins!`);
          } else if (result === "stalemate") {
            setGameStatus("Game over - Stalemate! It's a draw.");
          } else {
            setGameStatus(`Game over - ${result}`);
          }
          break;
        }

        case "OPPONENT_DISCONNECTED":
          setGameStatus("opponent disconnected");
          break;

        default:
          console.log("Unknown message type:", message.type);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, chess]);

  const startGame = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: INIT_GAME }));
    }
  };

  const renderGameStatus = () => {
    if (gameStatus === "waiting") {
      return <span className="text-lg">Click "Play Now" to start a game</span>;
    }
    if (gameStatus === "waiting for opponent") {
      return (
        <span className="text-lg text-gray-400">Waiting for opponent...</span>
      );
    }
    if (gameStatus.includes("Game over")) {
      return (
        <span className="text-xl font-bold text-red-500">{gameStatus}</span>
      );
    }
    if (gameStatus.includes("check")) {
      return (
        <span className="text-xl font-bold text-yellow-400">{gameStatus}</span>
      );
    }
    if (playerColor) {
      return (
        <span className="text-lg">
          You are playing as{" "}
          <span className="capitalize font-semibold">{playerColor}</span>
        </span>
      );
    }
    return null;
  };

  if (!socket) {
    return (
      <div className="text-center p-8 text-2xl">Connecting to server...</div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-6 p-6 bg-gray-900 text-white">
      {/* Chessboard Section */}
      <div className="flex-1 flex justify-center items-center">
        <Board chess={chess} setBoard={setBoard} socket={socket} board={board} />
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 bg-gray-800 rounded-lg p-6 flex flex-col justify-between shadow-lg">
        
        {/* Move History Table */}
        <div className="bg-gray-700 border border-gray-600 p-4 rounded-md mt-4 overflow-y-auto max-h-64 shadow-inner">
          <h3 className="text-xl font-bold mb-3 text-center text-white">
            Move History
          </h3>
          <table className="w-full text-center text-sm border-collapse">
            <thead className="bg-gray-600 sticky top-0">
              <tr>
                <th className="py-2 px-2 border-b border-gray-500">#</th>
                <th className="py-2 px-2 border-b border-gray-500">White</th>
                <th className="py-2 px-2 border-b border-gray-500">Black</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((row, index) => {
                const isLastMove =
                  index === getFormattedMoves().length - 1;
                return (
                   <tr
                    key={index}
                    className={`border-b border-gray-600 transition-colors duration-200 ${
                      isLastMove ? "bg-green-800 font-bold" : "hover:bg-gray-600"
                    }`}
                  >
                    <td className="py-1">{row.moveNumber}</td>
                    <td className="py-1">{row.white || ""}</td>
                    <td className="py-1">{row.black || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Status + Play Button */}
        <div className="mb-6">
          <div className="mb-4 p-3 rounded-md bg-gray-700 border border-gray-600">
            {renderGameStatus()}
          </div>
          <button
            className={`w-full py-3 rounded-md font-bold text-lg transition-all duration-200 ${
              gameStatus === "waiting" || gameStatus.includes("Game over")
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-600 cursor-not-allowed"
            }`}
            onClick={startGame}
            disabled={
              !(gameStatus === "waiting" || gameStatus.includes("Game over"))
            }
          >
            Play Now!
          </button>
        </div>

        {/* Game Result */}
        {result && (
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-md">
            <h3 className="text-xl font-bold mb-2">Game Result</h3>
            <p className="text-lg">Result: {result}</p>
            {winner && (
              <p className="text-lg font-semibold text-green-400">
                Winner: {winner}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
