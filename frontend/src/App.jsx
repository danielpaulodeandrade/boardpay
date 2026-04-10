import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import InviteHandler from "./pages/InviteHandler";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <Routes>
          <Route path="/" element={<Games />} />
          <Route path="/game/:id" element={<GameDetail />} />
          {/* ROTA PARA ENTRADA AUTOMÁTICA VIA QR CODE */}
          <Route path="/enter/:id/:pin" element={<InviteHandler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
