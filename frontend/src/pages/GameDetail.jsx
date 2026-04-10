import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from "html5-qrcode";
import TransferModal from "../components/TransferModal";
import translations from "../translations";
import { AppConfig } from "../config";

const API_URL = AppConfig.apiUrl;

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // CONFIGS GLOBAIS
  const [lang] = useState(localStorage.getItem('bp_lang') || 'pt');
  const [qrEnabled, setQrEnabled] = useState(false);
  const T = translations[lang] || translations.pt;

  async function toggleQr(val) {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/games/${id}/config`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_password: sessionStorage.getItem(`game_manager_pass_${id}`), qr_enabled: val }),
      });
      if (res.ok) {
        setQrEnabled(val);
      }
    } catch (e) { console.error("Error toggling QR", e); }
  }

  // Sessão Recuperada (Auto-Login)
  const [loggedInPlayer, setLoggedInPlayer] = useState(() => {
    const salvo = localStorage.getItem(`bp_session_jog_${id}`);
    return salvo ? JSON.parse(salvo) : null;
  }); 
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem(`bp_session_admin_${id}`) === 'true';
  });

  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState(""); 
  const [adminError, setAdminError] = useState(""); 
  const [showPin, setShowPin] = useState(false); 
  const [showRoomPin, setShowRoomPin] = useState(false); 

  // Sessão Admin (Gerente)
  const [adminPassInput, setAdminPassInput] = useState("");
  const [playerDetail, setPlayerDetail] = useState(null); 
  const [showInviteQr, setShowInviteQr] = useState(false);

  // PIX e Scanner 
  const [qrCobranca, setQrCobranca] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function carregarDados() {
    try {
      const resJogo = await fetch(`${API_URL}/games/${id}`);
      if (!resJogo.ok) throw new Error();
      const dataJogo = await resJogo.json();
      setGame(dataJogo);
      if (dataJogo.qr_enabled !== undefined) setQrEnabled(dataJogo.qr_enabled);

      let urlTrans = `${API_URL}/games/${id}/transactions`;
      if (!isAdmin && loggedInPlayer?.id) urlTrans += `?player_id=${loggedInPlayer.id}`;
      
      const resTrans = await fetch(urlTrans);
      const dataTrans = await resTrans.json();
      setTransactions(dataTrans);
    } catch (e) { 
      console.error(e);
      navigate('/'); 
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const pinEntry = sessionStorage.getItem(`game_pin_entry_${id}`);
    if (!pinEntry) { navigate('/'); return; }

    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [id, isAdmin, loggedInPlayer, navigate]);

  async function handleLoginGerente() {
    try {
      const res = await fetch(`${API_URL}/login-manager`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: id, manager_password: adminPassInput }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setLoggedInPlayer({ id: 'BANK', name: 'BANK' });
        
        localStorage.setItem(`bp_session_admin_${id}`, 'true');
        localStorage.setItem(`bp_session_jog_${id}`, JSON.stringify({ id: 'BANK', name: 'BANK' }));
        sessionStorage.setItem(`game_manager_pass_${id}`, adminPassInput);
        
        setAdminPassInput("");
        setAdminError("");
      } else { setAdminError(T.wrongAdmin); }
    } catch (e) { setAdminError(T.netError); }
  }

  async function handleLoginJogador(playerId) {
    if (pinInput.length < 4) return;
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: id, player_id: playerId, personal_pin: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        const SessionData = { id: data.player_id, name: data.name, pin: pinInput };
        setLoggedInPlayer(SessionData);
        localStorage.setItem(`bp_session_jog_${id}`, JSON.stringify(SessionData));
        
        setPinInput("");
        setLoginError("");
      } else { setLoginError({ id: playerId, msg: T.wrongPin }); }
    } catch (e) { setLoginError({ id: playerId, msg: T.netError }); }
  }

  async function verPinJogador(j) {
    try {
        const res = await fetch(`${API_URL}/games/${id}/admin`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ manager_password: sessionStorage.getItem(`game_manager_pass_${id}`) }), 
        });
        const data = await res.json();
        if (res.ok) { setPlayerDetail(data.players.find(item => item.id === j.id)); }
    } catch (e) { }
  }

  async function executarTransferencia({ de, para, valor, personal_pin }) {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          from_player_id: de === 'BANK' ? null : de, 
          to_player_id: para === 'BANK' ? null : para, 
          amount: Number(valor), 
          game_id: id,
          personal_pin: personal_pin 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setQrCobranca(null);
        carregarDados();
      } else {
        alert(data.error || T.transferError);
      }
    } catch (e) { alert(T.netError); }
  }

  useEffect(() => {
    if (scannerOpen && qrEnabled) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.type === 'pix_boardpay') {
             scanner.clear(); setScannerOpen(false);
             if (window.confirm(`${T.confirmPay} ${data.valor} ${T.to} ${data.nome}?`)) {
                const deId = isAdmin ? 'BANK' : loggedInPlayer?.id;
                executarTransferencia({ de: deId, para: data.de_id, valor: data.valor });
             }
          }
        } catch (e) { }
      });
      return () => scanner.clear();
    }
  }, [scannerOpen, qrEnabled, isAdmin, loggedInPlayer, T]);

  if (loading) return <div className="text-center p-10 text-slate-500 font-bold italic tracking-widest uppercase">{T.initializing}</div>;
  if (!game) return <div className="text-center p-10 text-red-500 font-black">{T.errorGame}</div>;

  return (
    <div className="max-w-xl mx-auto pb-24 space-y-6 px-4">
      
      <header className="py-4 bg-slate-900 sticky top-0 z-20 border-b border-slate-800 flex flex-col gap-4">
        {/* Linha 1: Voltar e Nome */}
        <div className="flex sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="text-slate-600 font-black text-xl hover:text-white transition-colors p-1">←</button>
            <h1 className="text-xl font-black text-white italic tracking-tighter truncate px-3">{game.name}</h1>
          </div>
          {loggedInPlayer && (
             <button 
                onClick={() => {
                   if(window.confirm(T.logout + "?")) {
                      setLoggedInPlayer(null); 
                      setIsAdmin(false);
                      localStorage.removeItem(`bp_session_admin_${id}`);
                      localStorage.removeItem(`bp_session_jog_${id}`);
                   }
                }} 
                className="w-auto sm:w-auto bg-red-600/10 text-red-500 text-[10px] font-black px-4 py-2.5 rounded-full border border-red-500/10 active:bg-red-600 active:text-white transition-all"
             >
                {T.logout}
             </button>
          )}
        </div>
        
        {/* Linha 2: Controles */}
        <div className="flex flex-wrap items-center justify-between gap-2">
           <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <button 
                    onClick={() => setShowRoomPin(true)}
                    className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-4 py-2.5 rounded-full border border-slate-700/50 hover:bg-slate-700/80 transition-colors"
                  >
                    {T.room}                  
                  </button>

                  {showRoomPin && (
                    <>
                      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90]" onClick={() => setShowRoomPin(false)}></div>
                      <div className="fixed inset-x-6 top-1/4 bg-slate-800 border-t-8 border-indigo-500 p-8 rounded-[3rem] z-[100] shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-75 max-w-xl mx-auto">
                         <div className="flex justify-between items-center mb-6">
                            <h4 className="text-indigo-500 font-black italic tracking-widest uppercase text-xs">{T.roomPin}</h4>
                            <button onClick={() => setShowRoomPin(false)} className="text-slate-500 font-black text-xl hover:text-white transition-colors">✕</button>
                         </div>
                         <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-indigo-500/20 text-center shadow-inner">
                            <p className="text-4xl font-black text-indigo-500 tracking-[0.3em] font-mono shadow-indigo-900/10 drop-shadow-lg">{sessionStorage.getItem(`game_pin_entry_${id}`)}</p>
                         </div>
                         <button onClick={() => setShowRoomPin(false)} className="w-full mt-6 bg-slate-900 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest border border-slate-700">{T.close}</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase italic ml-2">{T.qrcode}</span>
                  <button 
                    onClick={() => toggleQr(!qrEnabled)}
                    className={`py-1.5 px-3 rounded-full text-[10px] font-black transition-all border ${qrEnabled ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-500' : 'bg-red-600/20 border-red-500/30 text-red-500'}`}
                  >
                    {qrEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              )}

              {isAdmin && (
                <button 
                  onClick={() => setShowInviteQr(!showInviteQr)}
                  className={`text-[10px] font-black px-4 py-2.5 rounded-full border transition-all ${showInviteQr ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-600/10 text-purple-400 border-purple-500/20'}`}
                >
                  {showInviteQr ? T.close : T.inviteTitle}
                </button>
              )}
           </div>
        </div>
      </header>

      {showInviteQr && (
         <div className="bg-white p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 flex flex-col items-center gap-4 text-center">
            <h2 className="text-slate-900 font-black text-xs uppercase tracking-widest">{T.inviteTitle}</h2>
            <QRCodeSVG 
                value={`${API_URL}/enter/${id}/${sessionStorage.getItem(`game_pin_entry_${id}`)}`} 
                size={200}
                includeMargin={true}
            />
            <p className="text-slate-400 text-[10px] uppercase font-bold leading-relaxed">{T.inviteSub}</p>
         </div>
      )}

      {!loggedInPlayer && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-800 p-6 sm:p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl space-y-4">
             <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest text-center italic">{T.adminAuth}</h2>
             <input type="password" inputMode="numeric" pattern="[0-9]*" value={adminPassInput} onChange={(e) => { setAdminPassInput(e.target.value); setAdminError(""); }} placeholder={T.adminPlaceholder} className="w-full bg-slate-900 p-5 rounded-3xl text-white text-center font-bold outline-none focus:ring-1 ring-amber-500" />
             {adminError && <p className="text-red-500 text-center text-[10px] font-black animate-pulse bg-red-500/10 py-2 rounded-xl uppercase">{adminError}</p>}
             <button onClick={handleLoginGerente} className="w-full bg-amber-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-900/30">{T.adminBtn}</button>
          </div>

          <div className="text-center"><span className="text-slate-700 font-bold uppercase text-[9px] tracking-[0.4em]">{T.playerAuth}</span></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {game.players.map(j => (
               <div key={j.id} className="bg-slate-800 p-4 rounded-[2.5rem] flex flex-col items-center gap-3 border border-slate-700/50">
                  <span className="text-4xl">{j.avatar}</span>
                  <span className="text-[12px] font-black text-white uppercase text-center w-full truncate opacity-60">{j.name}</span>
                  <div className="w-full space-y-2">
                    <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="PIN" className="w-full bg-slate-900 p-3 rounded-2xl text-center text-xs text-white font-black outline-none ring-1 ring-slate-700" value={playerDetail?.id === j.id ? pinInput : ""} onChange={(e) => { setPlayerDetail({id: j.id}); setPinInput(e.target.value); setLoginError(""); }} />
                    {loginError && loginError.id === j.id && <p className="text-red-500 text-center text-[10px] font-black bg-red-500/10 py-1 rounded-lg uppercase">{loginError.msg}</p>}
                    <button onClick={() => handleLoginJogador(j.id)} className="w-full py-2 bg-purple-600 rounded-xl text-white font-black text-[9px] uppercase tracking-widest">OK 🚀</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {loggedInPlayer && (
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-500 border-2 ${isAdmin ? 'bg-gradient-to-br from-emerald-600 to-emerald-900 border-emerald-500/50 shadow-emerald-900/40' : 'bg-gradient-to-br from-indigo-700 to-purple-800 border-purple-500/50 shadow-purple-900/40'}`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-white text-[10px] bg-white/20 px-3 py-1 rounded-full uppercase font-black italic tracking-widest">{isAdmin ? T.managerPanel : `${T.playerAccount} ${loggedInPlayer.name}`}</span>
                <p className="text-white/40 text-[10px] font-bold">{T.boardpaySecurity}</p>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter relative z-10">
              <span className="text-2xl opacity-40 mr-1 italic">M$</span>
              {(isAdmin ? game.bank_balance : game.players.find(j => j.id === loggedInPlayer.id).balance).toLocaleString('pt-BR')}
            </h2>

            {/* MOSTRAR MEU PIN */}
            {!isAdmin && loggedInPlayer.pin && (
              <div className="mt-4 relative z-10 flex items-center gap-2 bg-black/20 w-fit px-3 py-1.5 rounded-xl border border-white/10">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">PIN</span>
                 <span className="text-sm font-mono text-white font-bold tracking-widest">{showPin ? loggedInPlayer.pin : "****"}</span>
                 <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white transition-colors ml-2">
                    {showPin ? "👁️" : "🙈"}
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button onClick={() => setShowModal(true)} className="bg-slate-800/80 p-6 rounded-[2.5rem] font-black text-white flex flex-col items-center gap-2 border border-slate-700/50 active:scale-95 shadow-lg">
                <span className="bg-purple-600/20 p-4 rounded-3xl text-2xl">💸</span>
                {T.pay}
             </button>
             {qrEnabled && (
                <button onClick={() => setScannerOpen(true)} className="bg-slate-800/80 p-6 rounded-[2.5rem] font-black text-white flex flex-col items-center gap-2 border border-slate-700/50 active:scale-95 shadow-lg">
                   <span className="bg-emerald-600/20 p-4 rounded-3xl text-2xl text-emerald-400">📸</span>
                   {T.readPix}
                </button>
             )}
          </div>

          {qrEnabled && (
             <div className="bg-slate-800/40 p-4 sm:p-6 rounded-[2.5rem] border border-dashed border-slate-700">
               {!qrCobranca ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder={T.receive} className="flex-1 bg-slate-900 p-5 rounded-3xl text-white font-black outline-none ring-1 ring-slate-800 focus:ring-emerald-500 transition-all text-center sm:text-left" onChange={(e) => setPinInput(e.target.value)} />
                    <button onClick={() => setQrCobranca({valor: Number(pinInput), de_id: isAdmin ? null : loggedInPlayer.id, de_nome: loggedInPlayer.name})} className="bg-emerald-600 p-5 sm:px-6 rounded-3xl font-black text-white active:scale-95 shadow-xl shadow-emerald-900/30 uppercase text-xs sm:text-base">{T.generate}</button>
                  </div>
               ) : (
                  <div className="flex flex-col items-center gap-6 bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl animate-in zoom-in-75">
                    <div className="w-full max-w-[220px]">
                        <QRCodeSVG value={JSON.stringify({type: 'pix_boardpay', valor: qrCobranca.valor, de_id: qrCobranca.de_id, nome: qrCobranca.de_nome})} size={null} style={{ width: '100%', height: 'auto' }} />
                    </div>
                    <p className="text-slate-950 font-black text-3xl tracking-tighter">M$ {qrCobranca.valor.toLocaleString()}</p>
                    <button onClick={() => setQrCobranca(null)} className="text-red-500 font-black uppercase text-[10px] underline bg-red-500/10 px-4 py-2 rounded-full">{T.close}</button>
                  </div>
               )}
             </div>
          )}

          {isAdmin && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 gap-2">
                 {game.players.map(j => (
                   <div key={j.id} onClick={() => verPinJogador(j)} className="bg-slate-950/40 p-5 rounded-[2.5rem] border border-slate-700/30 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-all group">
                     <div className="flex items-center gap-4">
                        <span className="text-3xl bg-slate-900 p-3 rounded-[1.5rem] shadow-inner">{j.avatar}</span>
                        <div><p className="text-sm font-black text-white uppercase italic tracking-tighter">{j.name}</p>
                        <p className="text-[12px] text-emerald-500 font-black italic tracking-widest">💰 M$ {j.balance.toLocaleString()}</p></div>
                     </div>
                     <div className="text-right flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 font-bold uppercase border border-slate-700 px-2 py-0.5 rounded-full mb-1">{T.viewPin}</span>
                        <p className="text-xl font-black text-white opacity-10 tracking-widest bg-slate-900 px-2 rounded-lg">****</p>
                     </div>
                     {playerDetail?.id === j.id && playerDetail.personal_pin && (
                        <div className="fixed inset-x-6 top-1/4 bg-slate-800 border-t-8 border-amber-500 p-8 rounded-[3rem] z-[100] shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-75 max-w-xl mx-auto">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-amber-500 font-black italic tracking-widest uppercase text-xs">{T.vault}</h4>
                              <button onClick={(e) => {e.stopPropagation(); setPlayerDetail(null);}} className="text-slate-500 font-black text-xl hover:text-white transition-colors">✕</button>
                           </div>
                           <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-amber-500/20 text-center shadow-inner">
                              <p className="text-6xl font-black text-amber-500 tracking-[0.3em] font-mono shadow-amber-900/10 drop-shadow-lg">{playerDetail.personal_pin}</p>
                           </div>
                           <button onClick={(e) => {e.stopPropagation(); setPlayerDetail(null);}} className="w-full mt-6 bg-slate-900 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest border border-slate-700">{T.close}</button>
                        </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="space-y-4">
             <h4 className="text-[12px] font-black text-slate-600 uppercase ml-4 tracking-widest">{isAdmin ? T.historyGlobal : T.historyPersonal}</h4>
             <div className="space-y-2">
                {transactions.length === 0 && <p className="text-center py-6 text-slate-700 text-xs font-bold uppercase">{T.noActivity}</p>}
                {transactions.map(t => (
                  <div key={t.id} className="bg-slate-800/40 p-5 rounded-[2rem] flex justify-between items-center border border-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 w-10 h-10 rounded-2xl font-black italic text-[11px] flex items-center justify-center ${ (t.from === loggedInPlayer.name || (isAdmin && t.from === 'BANK')) ? 'bg-red-400/10 text-red-500' : 'bg-emerald-400/10 text-emerald-500'}`}>
                        { (t.from === loggedInPlayer.name || (isAdmin && t.from === 'BANK')) ? 'OUT' : 'IN'}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-white uppercase tracking-tighter">{t.from} 👉 {t.to}</p>
                        <p className="text-[12px] text-slate-600 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black italic ${ (t.to === loggedInPlayer.name || (isAdmin && t.to === 'BANK')) ? 'text-emerald-500' : 'text-red-500'}`}>M$ {t.amount.toLocaleString()}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {scannerOpen && (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-white font-black italic text-2xl tracking-tighter">{T.scannerTitle}</h2>
             <button onClick={() => setScannerOpen(false)} className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-full text-white font-black uppercase text-[10px]">{T.close}</button>
          </div>
          <div className="rounded-[3rem] overflow-hidden border-4 border-emerald-500/20 shadow-2xl relative shadow-emerald-500/10"><div id="reader"></div></div>
          <p className="text-slate-500 text-center font-bold text-[10px] mt-10 uppercase tracking-[0.3em] animate-pulse">{T.scannerSub}</p>
        </div>
      )}

      {showModal && <TransferModal players={game.players} loggedInPlayer={loggedInPlayer} isAdmin={isAdmin} onClose={() => setShowModal(false)} onTransfer={executarTransferencia} />}
    </div>
  );
}
