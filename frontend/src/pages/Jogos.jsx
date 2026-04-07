import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "../translations";
import { AppConfig } from "../config";

const API_URL = AppConfig.apiUrl;
const AVATARS = ['🐶', '🦊', '🦅', '🐉', '🐙', 'REX', '🤖', '👾', '🦁', '🐱', '🐹', '🐰'];

export default function Jogos() {
  const navigate = useNavigate();
  const [jogos, setJogos] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // CONFIGURAÇÕES GLOBAIS (I18N)
  const [lang, setLang] = useState(localStorage.getItem('bp_lang') || 'pt');
  const T = translations[lang] || translations.pt;

  // Estado de Entrada
  const [showPinInput, setShowPinInput] = useState(null); 
  const [gamePin, setGamePin] = useState("");
  const [errorStatus, setErrorStatus] = useState({}); 

  const [nome, setNome] = useState("");
  const [senhaGerente, setSenhaGerente] = useState("");
  const [saldoInicialJog, setSaldoInicialJog] = useState(15000);
  const [jogadores, setJogadores] = useState([{ nome: "", avatar: "🐶" }, { nome: "", avatar: "🦊" }]);

  useEffect(() => {
    async function fetchJogos() {
       try {
         const res = await fetch(`${API_URL}/jogos`);
         const data = await res.json();
         setJogos(data);

         // 🛡️ LIMPEZA DE SESSÕES
         if (data.length === 0) {
            sessionStorage.clear();
            // Limpa logins persistentes também
            Object.keys(localStorage).forEach(key => {
               if (key.startsWith('bp_session_')) localStorage.removeItem(key);
            });
         } else {
            // Limpeza seletiva de sessões órfãs
            const todasChaves = Object.keys(sessionStorage);
            const gameKeys = todasChaves.filter(k => k.startsWith('game_pin_entry_'));
            gameKeys.forEach(key => {
               const idMesa = key.replace('game_pin_entry_', '');
               if (!data.find(j => j.id.toString() === idMesa)) {
                  sessionStorage.removeItem(key);
               }
            });
         }

       } catch (e) { console.error(e); }
    }
    fetchJogos();
    const interval = setInterval(fetchJogos, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = (val) => {
    setLang(val);
    localStorage.setItem('bp_lang', val);
  };

  async function handleEntrar(jogoId, forcedPin = null) {
    const pinParaUsar = forcedPin || gamePin;
    if (!pinParaUsar) return;
    try {
      const res = await fetch(`${API_URL}/jogos/entrar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogo_id: jogoId, pin_entrada: pinParaUsar }),
      });
      if (res.ok) {
        sessionStorage.setItem(`game_pin_entry_${jogoId}`, pinParaUsar);
        navigate(`/jogo/${jogoId}`);
      } else { 
        setErrorStatus(prev => ({ ...prev, [jogoId]: T.errorPin })); 
      }
    } catch (e) { 
      setErrorStatus(prev => ({ ...prev, [jogoId]: T.errorNetwork })); 
    }
  }

  const tentarAcessoDireto = (jogoId) => {
    const salvo = sessionStorage.getItem(`game_pin_entry_${jogoId}`);
    if (salvo) {
      setGamePin(salvo); // 👈 Garante que o PIN do estado esteja sincronizado
      handleEntrar(jogoId, salvo);
    } else {
      setShowPinInput(jogoId);
      setGamePin("");
      setErrorStatus({});
    }
  };

  async function criarJogo(e) {
    e.preventDefault();
    if (!nome || !senhaGerente || jogadores.some(j => !j.nome.trim())) { alert("Preencha tudo!"); return; }
    try {
      const res = await fetch(`${API_URL}/jogos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha_gerente: senhaGerente, saldo_inicial_jogador: Number(saldoInicialJog), jogadores }),
      });
      const data = await res.json();
      if (res.ok) {
        // 🚀 AUTO-LOGIN PARA QUEM CRIOU
        sessionStorage.setItem(`game_pin_entry_${data.id || data.jogo_id}`, data.pin_jogo);
        sessionStorage.setItem(`game_manager_pass_${data.id || data.jogo_id}`, senhaGerente);
        
        alert(`MESA CRIADA!\nPIN DE ACESSO: ${data.pin_jogo}\n(Anote este código para seus amigos!)`);
        
        setNome(""); setSenhaGerente(""); setJogadores([{ nome: "", avatar: "🐶" }, { nome: "", avatar: "🦊" }]);
        setIsCreating(false);
        navigate(`/jogo/${data.id || data.jogo_id}`);
      } else { alert(data.erro); }
    } catch (e) { alert("Erro ao criar"); }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <header className="flex flex-col gap-4 mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 italic leading-none">{T.title}</h1>
          <button onClick={() => { setIsCreating(!isCreating); setShowPinInput(null); }} className="bg-slate-800 text-purple-400 font-bold px-5 py-2.5 rounded-full hover:bg-slate-700 transition shadow-lg active:scale-95 text-xs">{isCreating ? T.back : T.newGame}</button>
        </div>
        
        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
           <div className="flex gap-1">
              {['pt', 'en', 'es'].map(l => (
                <button key={l} onClick={() => toggleLang(l)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${lang === l ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600'}`}>{l}</button>
              ))}
           </div>
        </div>
      </header>

      {isCreating ? (
        <form onSubmit={criarJogo} className="bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl space-y-6 border border-slate-700/50 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div>
               <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.gameNameLabel}</label>
               <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={T.gameNamePlaceholder} className="w-full bg-slate-900 p-4 rounded-2xl text-white outline-none focus:ring-1 ring-purple-500 font-bold" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.playerInitial}</label>
                  <input type="number" value={saldoInicialJog} onChange={(e) => setSaldoInicialJog(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl text-white font-black text-center" />
               </div>
               <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.managerPassLabel}</label>
                  <input type="password" value={senhaGerente} onChange={(e) => setSenhaGerente(e.target.value)} placeholder="Ex: 1234" className="w-full bg-slate-900 p-4 rounded-2xl text-white font-black text-center outline-none focus:ring-1 ring-amber-500 shadow-inner" />
               </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-[2rem] space-y-3 border border-slate-700/30">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-2 italic">{T.participants}</h3>
            {jogadores.map((jog, idx) => (
              <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl">
                  <input value={jog.nome} onChange={(e) => { const n = [...jogadores]; n[idx].nome = e.target.value; setJogadores(n); }} placeholder={`Jogador ${idx+1}`} className="bg-transparent text-white flex-1 outline-none font-bold italic" />
                  <button type="button" onClick={() => setJogadores(jogadores.filter((_, i) => i !== idx))} className="text-red-500 font-black px-2 hover:scale-110 trans-all">✕</button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                   {AVATARS.map(av => (
                      <button key={av} type="button" onClick={() => { const n = [...jogadores]; n[idx].avatar = av; setJogadores(n); }} className={`w-10 h-10 rounded-full text-xl transition-all ${jog.avatar === av ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-slate-800 opacity-40 hover:opacity-100'}`}>{av}</button>
                   ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setJogadores([...jogadores, {nome:"", avatar:"🐶"}])} className="w-full py-3 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest">{T.addParticipant}</button>
          </div>
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-purple-900/40 active:scale-95 transition-all tracking-widest">{T.createWorld}</button>
        </form>
      ) : (
        <div className="space-y-4">
          {jogos.length === 0 && (
             <div className="text-center p-12 bg-slate-800/30 rounded-[2rem] border border-dashed border-slate-700">
               <div className="text-6xl mb-4 filter grayscale opacity-40">🎲</div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">{T.noGames}</p>
               <p className="text-slate-600 text-[10px] font-bold uppercase mt-2 tracking-tighter">{T.noGamesSub}</p>
             </div>
          )}
          {jogos.map(jogo => (
            <div key={jogo.id} className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700/50 hover:border-purple-500/50 transition-all shadow-md group relative">
              <div className="flex justify-between items-center mb-4">
                 <div className="ml-2">
                    <h2 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors uppercase italic tracking-tighter">{jogo.nome}</h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic opacity-60">ID #{jogo.id}</p>
                 </div>
              </div>
              
              {showPinInput === jogo.id ? (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
                       <input value={gamePin} onChange={(e) => setGamePin(e.target.value)} autoFocus placeholder={T.pinPlaceholder} className="w-full bg-slate-900 p-5 rounded-3xl text-white text-center font-black italic outline-none ring-1 ring-purple-600 shadow-inner tracking-[0.4em]" />
                       <button onClick={() => handleEntrar(jogo.id)} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-white shadow-xl shadow-purple-900/40 hover:bg-purple-500 transition-colors uppercase text-xs tracking-widest italic">{T.accessVault} 🚀</button>
                    </div>
                    {errorStatus[jogo.id] && <p className="text-red-500 text-[10px] font-black uppercase text-center animate-bounce">{errorStatus[jogo.id]}</p>}
                    <button onClick={() => {setShowPinInput(null); setErrorStatus({}); setGamePin("");}} className="w-full text-slate-600 uppercase font-black text-[9px] tracking-[0.2em] underline">{T.cancel}</button>
                 </div>
              ) : (
                 <button onClick={() => tentarAcessoDireto(jogo.id)} className="w-full py-5 bg-slate-900 rounded-[1.5rem] text-purple-400 font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all font-black italic border border-slate-800 shadow-inner">
                    ⚡ {T.accessMesa}
                 </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
