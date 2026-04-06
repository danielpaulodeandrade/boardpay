import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

// No futuro, se quiser colocar imagens, basta trocar as strings por caminhos como '/avatars/img1.png'
const AVATARS = ['🐶', '🦊', '🦅', '🐉', '🐙', '🦖', '🤖', '👾'];

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Detalhes do Form
  const [nome, setNome] = useState("");
  const [saldoInicial, setSaldoInicial] = useState(15000);
  // Lista de jogadores (Começamos com 2 no mínimo)
  const [jogadores, setJogadores] = useState([
    { nome: "", avatar: "🐶" },
    { nome: "", avatar: "🦊" }
  ]);

  async function carregarJogos() {
    try {
      const res = await fetch(`${API_URL}/jogos`);
      const data = await res.json();
      setJogos(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    carregarJogos();
  }, []);

  const addJogador = () => {
    setJogadores([...jogadores, { nome: "", avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] }]);
  };

  const removeJogador = (index) => {
    const novos = [...jogadores];
    novos.splice(index, 1);
    setJogadores(novos);
  };

  const updateJogador = (index, field, value) => {
    const novos = [...jogadores];
    novos[index][field] = value;
    setJogadores(novos);
  };

  async function criarJogo(e) {
    e.preventDefault();
    if (!nome || jogadores.some(j => !j.nome.trim())) {
      alert("Dê um nome para a partida e preencha o nome de todos os jogadores!");
      return;
    }

    await fetch(`${API_URL}/jogos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        nome,
        saldo_inicial: Number(saldoInicial),
        jogadores
      }),
    });

    // Resetar form
    setNome("");
    setSaldoInicial(15000);
    setJogadores([{ nome: "", avatar: "🐶" }, { nome: "", avatar: "🦊" }]);
    setIsCreating(false);
    carregarJogos();
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          BoardPay
        </h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-slate-800/80 text-purple-400 font-bold px-5 py-2.5 rounded-full hover:bg-slate-700 transition shadow-lg"
        >
          {isCreating ? 'Voltar' : '+ Nova Partida'}
        </button>
      </header>

      {/* FORMULÁRIO DE CRIAÇÃO PREMINUM */}
      {isCreating && (
        <form onSubmit={criarJogo} className="bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl space-y-6 border border-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Nova Partida</h2>
            <p className="text-slate-400 text-sm mt-1">Configure o banco para rodar no jogo.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider font-bold mb-2 ml-1">Nome da Rodada</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Noite de Sábado"
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider font-bold mb-2 ml-1">Saldo Inicial p/ Jogador</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-bold">M$</span>
                <input
                  type="number"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Participantes</h3>
              <button 
                type="button" 
                onClick={addJogador} 
                className="text-purple-400 text-xs font-bold bg-purple-500/10 px-3 py-1.5 rounded-full hover:bg-purple-500/20 active:scale-95 transition-all"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {jogadores.map((jog, idx) => (
                <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 group">
                  <div className="flex justify-between items-center gap-2">
                    <input
                      value={jog.nome}
                      onChange={(e) => updateJogador(idx, 'nome', e.target.value)}
                      placeholder={`Jogador ${idx + 1}`}
                      className="flex-1 bg-transparent text-white font-bold outline-none placeholder-slate-600 text-lg"
                    />
                    {jogadores.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => removeJogador(idx)} 
                        className="text-red-400/80 text-xs uppercase font-bold p-2 hover:bg-red-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  
                  {/* Seletor Círculos Avatares */}
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {AVATARS.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => updateJogador(idx, 'avatar', av)}
                        className={`text-2xl w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          jog.avatar === av 
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 scale-110 shadow-lg shadow-purple-500/30' 
                          : 'bg-slate-800 hover:bg-slate-700 opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-900/40 hover:shadow-purple-700/50 active:scale-[0.98] transition-all text-lg tracking-wide"
          >
            Começar o Jogo!
          </button>
        </form>
      )}

      {/* LISTA DE JOGOS */}
      <div className="space-y-4">
        {!isCreating && jogos.length === 0 && (
           <div className="text-center p-12 bg-slate-800/30 rounded-[2rem] border border-dashed border-slate-700">
             <div className="text-6xl mb-4 opacity-50 filter grayscale">🎲</div>
             <p className="text-slate-400 font-medium">Nenhum banco aberto.</p>
             <p className="text-slate-500 text-sm mt-1">Crie uma partida para começar jogar.</p>
           </div>
        )}
        
        {!isCreating && jogos.map((jogo) => (
          <div key={jogo.id} className="bg-slate-800 p-5 rounded-[2rem] shadow-md flex items-center justify-between group hover:ring-2 hover:ring-purple-500/50 transition-all cursor-pointer">
            <div className="ml-2">
              <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{jogo.nome}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                {jogo.data_criacao ? new Date(jogo.data_criacao).toLocaleDateString("pt-BR") : "---"}
              </p>
            </div>

            <button className="bg-slate-900 text-purple-400 p-3 px-6 font-bold rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
              Entrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
