import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Jogos from "./pages/Jogos";
import JogoDetalhe from "./pages/JogoDetalhe";
import InviteHandler from "./pages/InviteHandler";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <Routes>
          <Route path="/" element={<Jogos />} />
          <Route path="/jogo/:id" element={<JogoDetalhe />} />
          {/* ROTA PARA ENTRADA AUTOMÁTICA VIA QR CODE */}
          <Route path="/entrar/:id/:pin" element={<InviteHandler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
