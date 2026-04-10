import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "../translations";
import { AppConfig } from "../config";

const API_URL = AppConfig.apiUrl;
const AVATARS = ['🐶', '🦊', '🦅', '🐉', '🐙', '🦖', '🤖', '👾', '🦁', '🐱', '🐹', '🐰'];

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const [lang, setLang] = useState(localStorage.getItem('bp_lang') || 'pt');
  const T = translations[lang] || translations.pt;

  const [showPinInput, setShowPinInput] = useState(null); 
  const [gamePin, setGamePin] = useState("");
  const [errorStatus, setErrorStatus] = useState({}); 

  const [name, setName] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [playerInitialBalance, setPlayerInitialBalance] = useState(15000);
  const [players, setPlayers] = useState([{ name: "", avatar: "🐶" }, { name: "", avatar: "🦊" }]);

  useEffect(() => {
    async function fetchGames() {
       try {
         const res = await fetch(`${API_URL}/games`);
         const data = await res.json();
         setGames(data);

         if (data.length === 0) {
            sessionStorage.clear();
            Object.keys(localStorage).forEach(key => {
               if (key.startsWith('bp_session_')) localStorage.removeItem(key);
            });
         } else {
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
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = (val) => {
    setLang(val);
    localStorage.setItem('bp_lang', val);
  };

  async function handleEntrar(gameId, forcedPin = null) {
    const pinParaUsar = forcedPin || gamePin;
    if (!pinParaUsar) return;
    try {
      const res = await fetch(`${API_URL}/games/enter`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId, entry_pin: pinParaUsar }),
      });
      if (res.ok) {
        sessionStorage.setItem(`game_pin_entry_${gameId}`, pinParaUsar);
        navigate(`/game/${gameId}`);
      } else { 
        setErrorStatus(prev => ({ ...prev, [gameId]: T.errorPin })); 
      }
    } catch (e) { 
      setErrorStatus(prev => ({ ...prev, [gameId]: T.errorNetwork })); 
    }
  }

  const tentarAcessoDireto = (gameId) => {
    const salvo = sessionStorage.getItem(`game_pin_entry_${gameId}`);
    if (salvo) {
      setGamePin(salvo); 
      handleEntrar(gameId, salvo);
    } else {
      setShowPinInput(gameId);
      setGamePin("");
      setErrorStatus({});
    }
  };

  async function criarJogo(e) {
    e.preventDefault();
    if (!name || !managerPassword || players.some(j => !j.name.trim())) { alert(T.fillAllFields); return; }
    try {
      const res = await fetch(`${API_URL}/games`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, manager_password: managerPassword, player_initial_balance: Number(playerInitialBalance), players }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem(`game_pin_entry_${data.id || data.game_id}`, data.game_pin);
        sessionStorage.setItem(`game_manager_pass_${data.id || data.game_id}`, managerPassword);
        
        alert(`${T.gameCreated} ${data.game_pin}\n${T.gameCreatedSub}`);
        
        setName(""); setManagerPassword(""); setPlayers([{ name: "", avatar: "🐶" }, { name: "", avatar: "🦊" }]);
        setIsCreating(false);
        navigate(`/game/${data.id || data.game_id}`);
      } else { alert(data.error); }
    } catch (e) { alert(T.createError); }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <header className="flex flex-col gap-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/logo192.png" alt="Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 italic leading-none px-2">{T.title}</h1>
          </div>
          <button onClick={() => { setIsCreating(!isCreating); setShowPinInput(null); }} className="w-full sm:w-auto bg-slate-800 text-purple-400 font-bold px-5 py-2.5 rounded-full hover:bg-slate-700 transition shadow-lg active:scale-95 text-xs">{isCreating ? T.back : T.newGame}</button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex-1 sm:flex-none">
            <div className="flex gap-1 w-full justify-around">
                {['pt', 'en', 'es'].map(l => (
                  <button key={l} onClick={() => toggleLang(l)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${lang === l ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600'}`}>{l}</button>
                ))}
            </div>
          </div>
        </div>
      </header>

      {isCreating ? (
        <form onSubmit={criarJogo} className="bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl space-y-6 border border-slate-700/50 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div>
               <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.gameNameLabel}</label>
               <input value={name} onChange={(e) => setName(e.target.value)} placeholder={T.gameNamePlaceholder} className="w-full bg-slate-900 p-4 rounded-2xl text-white outline-none focus:ring-1 ring-purple-500 font-bold" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.playerInitial}</label>
                  <input type="number" value={playerInitialBalance} onChange={(e) => setPlayerInitialBalance(e.target.value)} className="w-full bg-slate-900 p-4 rounded-2xl text-white font-black text-center" />
               </div>
               <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest leading-none">{T.managerPassLabel}</label>
                  <input type="password" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} placeholder={T.pinExample} className="w-full bg-slate-900 p-4 rounded-2xl text-white font-black text-center outline-none focus:ring-1 ring-amber-500 shadow-inner" />
               </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-[2rem] space-y-3 border border-slate-700/30">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-2 italic">{T.participants}</h3>
            {players.map((jog, idx) => (
              <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl">
                  <input value={jog.name} onChange={(e) => { const n = [...players]; n[idx].name = e.target.value; setPlayers(n); }} placeholder={`${T.player} ${idx+1}`} className="bg-transparent text-white flex-1 outline-none font-bold italic" />
                  <button type="button" onClick={() => setPlayers(players.filter((_, i) => i !== idx))} className="text-red-500 font-black px-2 hover:scale-110 trans-all">✕</button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                   {AVATARS.map(av => (
                      <button key={av} type="button" onClick={() => { const n = [...players]; n[idx].avatar = av; setPlayers(n); }} className={`w-10 h-10 rounded-full text-xl transition-all ${jog.avatar === av ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-slate-800 opacity-40 hover:opacity-100'}`}>{av}</button>
                   ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setPlayers([...players, {name:"", avatar:"🐶"}])} className="w-full py-3 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest">{T.addParticipant}</button>
          </div>
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white font-black text-lg shadow-xl shadow-purple-900/40 active:scale-95 transition-all tracking-widest">{T.createWorld}</button>
        </form>
      ) : (
        <div className="space-y-4">
          {games.length === 0 && (
             <div className="text-center p-12 bg-slate-800/30 rounded-[2rem] border border-dashed border-slate-700">
               <div className="text-6xl mb-4 filter grayscale opacity-40">🎲</div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">{T.noGames}</p>
               <p className="text-slate-600 text-[10px] font-bold uppercase mt-2 tracking-tighter">{T.noGamesSub}</p>
             </div>
          )}
          {games.map(game => (
            <div key={game.id} className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700/50 hover:border-purple-500/50 transition-all shadow-md group relative">
              <div className="flex justify-between items-center mb-4">
                 <div className="ml-2">
                    <h2 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors uppercase italic tracking-tighter">{game.name}</h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic opacity-60">ID #{game.id}</p>
                 </div>
              </div>
              
              {showPinInput === game.id ? (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
                       <input value={gamePin} onChange={(e) => setGamePin(e.target.value)} autoFocus placeholder={T.pinPlaceholder} className="w-full bg-slate-900 p-5 rounded-3xl text-white text-center font-black italic outline-none ring-1 ring-purple-600 shadow-inner tracking-[0.4em]" />
                       <button onClick={() => handleEntrar(game.id)} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-white shadow-xl shadow-purple-900/40 hover:bg-purple-500 transition-colors uppercase text-xs tracking-widest italic">{T.accessVault} 🚀</button>
                    </div>
                    {errorStatus[game.id] && <p className="text-red-500 text-[10px] font-black uppercase text-center animate-bounce">{errorStatus[game.id]}</p>}
                    <button onClick={() => {setShowPinInput(null); setErrorStatus({}); setGamePin("");}} className="w-full text-slate-600 uppercase font-black text-[9px] tracking-[0.2em] underline">{T.cancel}</button>
                 </div>
              ) : (
                 <button onClick={() => tentarAcessoDireto(game.id)} className="w-full py-5 bg-slate-900 rounded-[1.5rem] text-purple-400 font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all font-black italic border border-slate-800 shadow-inner">
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
