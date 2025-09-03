import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-gray-900 grid place-items-center px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <img
          src="/ChessBoard.jpeg"
          alt="chessBoard"
          className="w-72 mx-auto rounded shadow-lg"
        />
        <div className="text-center md:text-left">
          <h1 className="text-white text-4xl font-bold mb-4">Welcome to Chess Arena</h1>
          <p className="text-gray-300 mb-6">Play online chess with your friends in real time!</p>
          <button
            onClick={handleJoin}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded transition"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
