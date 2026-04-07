import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from "html5-qrcode";
import TransferModal from "../components/TransferModal";
import { AppConfig } from "../config";

const API_URL = AppConfig.apiUrl;

const translations = {
  pt: {
    initializing: "INICIALIZANDO COFRE...",
    errorGame: "JOGO NÃO ENCONTRADO",
    managerPanel: "PAINEL GERENTE",
    playerAccount: "CONTA",
    pay: "PAGAR",
    readPix: "LER PIX",
    receive: "RECEBER",
    generate: "GERAR",
    vault: "COFRE DE SEGURANÇA",
    close: "FECHAR",
    historyGlobal: "HISTÓRICO GLOBAL",
    historyPersonal: "SUAS ATIVIDADES",
    noActivity: "Nenhuma movimentação",
    back: "Voltar",
    logout: "SAIR",
    scannerTitle: "CÂMERA SCAN",
    scannerSub: "Centralize o PIX QR no visor",
    inviteTitle: "CONVIDAR",
    inviteSub: "Aponte a câmera para entrar nesta mesa automaticamente",
    adminAuth: "Gerência do Banco",
    adminPlaceholder: "Senha Administrativa",
    adminBtn: "Assumir Banco Central 🏦",
    playerAuth: "OU ACESSE SUA CONTA JOGADOR",
    wrongAdmin: "SENHA GERENTE INCORRETA",
    wrongPin: "PIN PESSOAL INCORRETO",
    netError: "ERRO DE REDE"
  },
  en: {
    initializing: "INITIALIZING VAULT...",
    errorGame: "GAME NOT FOUND",
    managerPanel: "MANAGER PANEL",
    playerAccount: "ACCOUNT",
    pay: "PAY",
    readPix: "READ PIX",
    receive: "RECEIVE",
    generate: "GENERATE",
    vault: "SECURITY VAULT",
    close: "CLOSE",
    historyGlobal: "GLOBAL HISTORY",
    historyPersonal: "YOUR ACTIVITIES",
    noActivity: "No transactions",
    back: "Back",
    logout: "LOGOUT",
    scannerTitle: "CAMERA SCAN",
    scannerSub: "Center the PIX QR in the viewfinder",
    inviteTitle: "INVITE",
    inviteSub: "Point the camera to join this table automatically",
    adminAuth: "Bank Management",
    adminPlaceholder: "Admin Password",
    adminBtn: "Take Over Central Bank 🏦",
    playerAuth: "OR LOG INTO YOUR PLAYER ACCOUNT",
    wrongAdmin: "INCORRECT ADMIN PASSWORD",
    wrongPin: "INCORRECT PERSONAL PIN",
    netError: "NETWORK ERROR"
  },
  es: {
    initializing: "INICIALIZANDO BÓVEDA...",
    errorGame: "JUEGO NO ENCONTRADO",
    managerPanel: "PANEL GERENTE",
    playerAccount: "CUENTA",
    pay: "PAGAR",
    readPix: "LEER PIX",
    receive: "RECIBIR",
    generate: "GENERAR",
    vault: "BÓVEDA DE SEGURIDAD",
    close: "CERRAR",
    historyGlobal: "HISTORIAL GLOBAL",
    historyPersonal: "TUS ACTIVIDADES",
    noActivity: "Ninguna transacción",
    back: "Volver",
    logout: "CERRAR SESIÓN",
    scannerTitle: "CÁMARA SCAN",
    scannerSub: "Centre el PIX QR en el visor",
    inviteTitle: "INVITAR",
    inviteSub: "Apunta la cámara para entrar en esta mesa automáticamente",
    adminAuth: "Gerencia del Banco",
    adminPlaceholder: "Contraseña Administrativa",
    adminBtn: "Asumir Banco Central 🏦",
    playerAuth: "O ACCEDA A SU CUENTA DE JUGADOR",
    wrongAdmin: "CONTRASEÑA GERENTE INCORRECTA",
    wrongPin: "PIN PERSONAL INCORRECTO",
    netError: "ERROR DE RED"
  }
};

export default function JogoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jogo, setJogo] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // CONFIGS GLOBAIS
  const [lang] = useState(localStorage.getItem('bp_lang') || 'pt');
  const [qrEnabled, setQrEnabled] = useState(true);
  const T = translations[lang] || translations.pt;

  async function toggleQr(val) {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_URL}/jogos/${id}/config`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha_gerente: sessionStorage.getItem(`game_manager_pass_${id}`), qr_enabled: val }),
      });
      if (res.ok) {
        setQrEnabled(val);
      }
    } catch (e) { console.error("Erro ao mudar QR", e); }
  }

  // Sessão Recuperada (Auto-Login)
  const [loggedInJogador, setLoggedInJogador] = useState(() => {
    const salvo = localStorage.getItem(`bp_session_jog_${id}`);
    return salvo ? JSON.parse(salvo) : null;
  }); 
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem(`bp_session_admin_${id}`) === 'true';
  });

  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState(""); // Erro para os jogadores
  const [adminError, setAdminError] = useState(""); // Erro para o gerente
  const [showPin, setShowPin] = useState(false); // Ver PIN Pessoal
  const [showRoomPin, setShowRoomPin] = useState(false); // Ver PIN da Mesa

  // Sessão Admin (Gerente)
  const [adminPassInput, setAdminPassInput] = useState("");
  const [detalheJogador, setDetalheJogador] = useState(null); 
  const [showInviteQr, setShowInviteQr] = useState(false);

  // PIX e Scanner (REINSTALADOS CORRETAMENTE)
  const [qrCobranca, setQrCobranca] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function carregarDados() {
    try {
      const resJogo = await fetch(`${API_URL}/jogos/${id}`);
      if (!resJogo.ok) throw new Error();
      const dataJogo = await resJogo.json();
      setJogo(dataJogo);
      if (dataJogo.qr_enabled !== undefined) setQrEnabled(dataJogo.qr_enabled);

      let urlTrans = `${API_URL}/jogos/${id}/transacoes`;
      if (!isAdmin && loggedInJogador?.id) urlTrans += `?jogador_id=${loggedInJogador.id}`;
      
      const resTrans = await fetch(urlTrans);
      const dataTrans = await resTrans.json();
      setTransacoes(dataTrans);
    } catch (e) { 
      console.error(e);
      navigate('/'); // Redireciona se der erro (ex: jogo não existe)
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const pinEntry = sessionStorage.getItem(`game_pin_entry_${id}`);
    if (!pinEntry) { navigate('/'); return; }

    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, [id, isAdmin, loggedInJogador, navigate]);

  async function handleLoginGerente() {
    try {
      const res = await fetch(`${API_URL}/login-gerente`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogo_id: id, senha_gerente: adminPassInput }),
      });
      if (res.ok) {
        setIsAdmin(true);
        setLoggedInJogador({ id: 'BANCO', nome: 'BANCO' });
        
        localStorage.setItem(`bp_session_admin_${id}`, 'true');
        localStorage.setItem(`bp_session_jog_${id}`, JSON.stringify({ id: 'BANCO', nome: 'BANCO' }));
        sessionStorage.setItem(`game_manager_pass_${id}`, adminPassInput);
        
        setAdminPassInput("");
        setAdminError("");
      } else { setAdminError(T.wrongAdmin); }
    } catch (e) { setAdminError(T.netError); }
  }

  async function handleLoginJogador(jogadorId) {
    if (pinInput.length < 4) return;
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogo_id: id, jogador_id: jogadorId, pin_pessoal: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        const SessionData = { id: data.jogador_id, nome: data.nome, pin: pinInput };
        setLoggedInJogador(SessionData);
        localStorage.setItem(`bp_session_jog_${id}`, JSON.stringify(SessionData));
        
        setPinInput("");
        setLoginError("");
      } else { setLoginError({ id: jogadorId, msg: T.wrongPin }); }
    } catch (e) { setLoginError({ id: jogadorId, msg: T.netError }); }
  }

  async function verPinJogador(j) {
    try {
        const res = await fetch(`${API_URL}/jogos/${id}/admin`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senha_gerente: sessionStorage.getItem(`game_manager_pass_${id}`) }), 
        });
        const data = await res.json();
        if (res.ok) { setDetalheJogador(data.jogadores.find(item => item.id === j.id)); }
    } catch (e) { }
  }

  async function executarTransferencia({ de, para, valor, pin_pessoal }) {
    try {
      const res = await fetch(`${API_URL}/transacoes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          de_jogador_id: de === 'BANCO' ? null : de, 
          para_jogador_id: para === 'BANCO' ? null : para, 
          valor: Number(valor), 
          jogo_id: id,
          pin_pessoal: pin_pessoal // 🛡️ PIN enviado para validação
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setQrCobranca(null);
        carregarDados();
      } else {
        alert(data.erro || "Erro na transferência");
      }
    } catch (e) { alert("Erro de Rede"); }
  }

  useEffect(() => {
    if (scannerOpen && qrEnabled) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.type === 'pix_boardpay') {
             scanner.clear(); setScannerOpen(false);
             if (window.confirm(`Pagar M$ ${data.valor} para ${data.nome}?`)) {
                const deId = isAdmin ? 'BANCO' : loggedInJogador?.id;
                executarTransferencia({ de: deId, para: data.de_id, valor: data.valor });
             }
          }
        } catch (e) { }
      });
      return () => scanner.clear();
    }
  }, [scannerOpen, qrEnabled, isAdmin, loggedInJogador]);

  if (loading) return <div className="text-center p-10 text-slate-500 font-bold italic tracking-widest uppercase">{T.initializing}</div>;
  if (!jogo) return <div className="text-center p-10 text-red-500 font-black">{T.errorGame}</div>;

  return (
    <div className="max-w-xl mx-auto pb-24 space-y-6 px-4">
      
      <header className="py-4 bg-slate-900 sticky top-0 z-20 border-b border-slate-800 flex flex-col gap-4">
        {/* Linha 1: Voltar e Nome */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-slate-600 font-black text-xl hover:text-white transition-colors p-1">←</button>
          <h1 className="text-xl font-black text-white italic tracking-tighter truncate">{jogo.nome}</h1>
        </div>
        
        {/* Linha 2: Controles */}
        <div className="flex flex-wrap items-center justify-between gap-2">
           <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700/50">
                  <span className="text-[7px] font-black text-slate-500 uppercase italic ml-2">ROOM</span>
                  <button 
                    onClick={() => setShowRoomPin(!showRoomPin)}
                    className="bg-slate-900 px-3 py-1.5 rounded-full text-[10px] font-mono text-white font-bold flex items-center gap-2 border border-slate-700"
                  >
                    {showRoomPin ? sessionStorage.getItem(`game_pin_entry_${id}`) : "****"}
                    <span className="text-[12px]">{showRoomPin ? "👁️" : "🙈"}</span>
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700/50">
                  <span className="text-[7px] font-black text-slate-500 uppercase italic ml-2">QR Code</span>
                  <button 
                    onClick={() => toggleQr(!qrEnabled)}
                    className={`py-1.5 px-3 rounded-full text-[9px] font-black transition-all border ${qrEnabled ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-500' : 'bg-red-600/20 border-red-500/30 text-red-500'}`}
                  >
                    {qrEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              )}

              {isAdmin && (
                <button 
                  onClick={() => setShowInviteQr(!showInviteQr)}
                  className={`text-[9px] font-black px-4 py-2.5 rounded-full border transition-all ${showInviteQr ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-600/10 text-purple-400 border-purple-500/20'}`}
                >
                  {showInviteQr ? T.close : 'CONVIDAR'}
                </button>
              )}
           </div>

           {loggedInJogador && (
             <button 
                onClick={() => {
                   if(window.confirm(T.logout + "?")) {
                      setLoggedInJogador(null); 
                      setIsAdmin(false);
                      localStorage.removeItem(`bp_session_admin_${id}`);
                      localStorage.removeItem(`bp_session_jog_${id}`);
                   }
                }} 
                className="bg-red-600/10 text-red-500 text-[10px] font-black px-4 py-2.5 rounded-full border border-red-500/10 active:bg-red-600 active:text-white transition-all"
             >
                {T.logout}
             </button>
           )}
        </div>
      </header>

      {showInviteQr && (
         <div className="bg-white p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 flex flex-col items-center gap-4 text-center">
            <h2 className="text-slate-900 font-black text-xs uppercase tracking-widest">{T.inviteTitle}</h2>
            <QRCodeSVG 
                value={`${window.location.origin}/entrar/${id}/${sessionStorage.getItem(`game_pin_entry_${id}`)}`} 
                size={200}
                includeMargin={true}
            />
            <p className="text-slate-400 text-[10px] uppercase font-bold leading-relaxed">{T.inviteSub}</p>
         </div>
      )}

      {!loggedInJogador && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-800 p-8 rounded-[3rem] border border-slate-700/50 shadow-2xl space-y-4">
             <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest text-center italic">{T.adminAuth}</h2>
             <input type="password" value={adminPassInput} onChange={(e) => { setAdminPassInput(e.target.value); setAdminError(""); }} placeholder={T.adminPlaceholder} className="w-full bg-slate-900 p-5 rounded-3xl text-white text-center font-bold outline-none focus:ring-1 ring-amber-500" />
             {adminError && <p className="text-red-500 text-center text-[10px] font-black animate-pulse bg-red-500/10 py-2 rounded-xl uppercase">{adminError}</p>}
             <button onClick={handleLoginGerente} className="w-full bg-amber-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-900/30">{T.adminBtn}</button>
          </div>

          <div className="text-center"><span className="text-slate-700 font-bold uppercase text-[9px] tracking-[0.4em]">{T.playerAuth}</span></div>

          <div className="grid grid-cols-2 gap-4">
             {jogo.jogadores.map(j => (
               <div key={j.id} className="bg-slate-800 p-4 rounded-[2.5rem] flex flex-col items-center gap-3 border border-slate-700/50">
                  <span className="text-4xl">{j.avatar}</span>
                  <span className="text-[10px] font-black text-white uppercase text-center w-full truncate opacity-60">{j.nome}</span>
                  <div className="w-full space-y-2">
                    <input type="password" maxLength={4} placeholder="PIN" className="w-full bg-slate-900 p-3 rounded-2xl text-center text-xs text-white font-black outline-none ring-1 ring-slate-700" value={detalheJogador?.id === j.id ? pinInput : ""} onChange={(e) => { setDetalheJogador({id: j.id}); setPinInput(e.target.value); setLoginError(""); }} />
                    {loginError && loginError.id === j.id && <p className="text-red-500 text-center text-[8px] font-black bg-red-500/10 py-1 rounded-lg uppercase">{loginError.msg}</p>}
                    <button onClick={() => handleLoginJogador(j.id)} className="w-full py-2 bg-purple-600 rounded-xl text-white font-black text-[9px] uppercase tracking-widest">OK 🚀</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {loggedInJogador && (
        <div className="space-y-6">
          <div className={`p-8 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-500 border-2 ${isAdmin ? 'bg-gradient-to-br from-emerald-600 to-emerald-900 border-emerald-500/50 shadow-emerald-900/40' : 'bg-gradient-to-br from-indigo-700 to-purple-800 border-purple-500/50 shadow-purple-900/40'}`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-white text-[9px] bg-white/20 px-3 py-1 rounded-full uppercase font-black italic tracking-widest">{isAdmin ? T.managerPanel : `${T.playerAccount} ${loggedInJogador.nome}`}</span>
                <p className="text-white/40 text-[8px] font-bold">BOARDPAY SECURITY</p>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter relative z-10">
              <span className="text-2xl opacity-40 mr-1 italic">M$</span>
              {(isAdmin ? jogo.saldo_banco : jogo.jogadores.find(j => j.id === loggedInJogador.id).saldo).toLocaleString('pt-BR')}
            </h2>

            {/* MOSTRAR MEU PIN */}
            {!isAdmin && loggedInJogador.pin && (
              <div className="mt-4 relative z-10 flex items-center gap-2 bg-black/20 w-fit px-3 py-1.5 rounded-xl border border-white/10">
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">PIN</span>
                 <span className="text-sm font-mono text-white font-bold tracking-widest">{showPin ? loggedInJogador.pin : "****"}</span>
                 <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white transition-colors ml-2">
                    {showPin ? "👁️" : "🙈"}
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
             <div className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-dashed border-slate-700">
               {!qrCobranca ? (
                  <div className="flex gap-2">
                    <input type="number" placeholder={T.receive} className="flex-1 bg-slate-900 p-5 rounded-3xl text-white font-black outline-none ring-1 ring-slate-800 focus:ring-emerald-500 transition-all" onChange={(e) => setPinInput(e.target.value)} />
                    <button onClick={() => setQrCobranca({valor: Number(pinInput), de_id: isAdmin ? null : loggedInJogador.id, de_nome: loggedInJogador.nome})} className="bg-emerald-600 px-6 rounded-3xl font-black text-white active:scale-95 shadow-xl shadow-emerald-900/30">{T.generate}</button>
                  </div>
               ) : (
                  <div className="flex flex-col items-center gap-6 bg-white p-10 rounded-[3.5rem] shadow-2xl animate-in zoom-in-75">
                    <QRCodeSVG value={JSON.stringify({type: 'pix_boardpay', valor: qrCobranca.valor, de_id: qrCobranca.de_id, nome: qrCobranca.de_nome})} size={220} />
                    <p className="text-slate-950 font-black text-3xl tracking-tighter">M$ {qrCobranca.valor.toLocaleString()}</p>
                    <button onClick={() => setQrCobranca(null)} className="text-red-500 font-black uppercase text-[10px] underline bg-red-500/10 px-4 py-2 rounded-full">{T.close}</button>
                  </div>
               )}
             </div>
          )}

          {isAdmin && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 gap-2">
                 {jogo.jogadores.map(j => (
                   <div key={j.id} onClick={() => verPinJogador(j)} className="bg-slate-950/40 p-5 rounded-[2.5rem] border border-slate-700/30 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-all group">
                     <div className="flex items-center gap-4">
                        <span className="text-3xl bg-slate-900 p-3 rounded-[1.5rem] shadow-inner">{j.avatar}</span>
                        <div><p className="text-sm font-black text-white uppercase italic tracking-tighter">{j.nome}</p>
                        <p className="text-[10px] text-emerald-500 font-black italic tracking-widest">💰 M$ {j.saldo.toLocaleString()}</p></div>
                     </div>
                     <div className="text-right flex flex-col items-end">
                        <span className="text-[7px] text-slate-500 font-bold uppercase border border-slate-700 px-2 py-0.5 rounded-full mb-1">Ver PIN</span>
                        <p className="text-xl font-black text-white opacity-10 tracking-widest bg-slate-900 px-2 rounded-lg">****</p>
                     </div>
                     {detalheJogador?.id === j.id && detalheJogador.pin_pessoal && (
                        <div className="fixed inset-x-6 top-1/4 bg-slate-800 border-t-8 border-amber-500 p-8 rounded-[3rem] z-[100] shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-75">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-amber-500 font-black italic tracking-widest uppercase text-xs">{T.vault}</h4>
                              <button onClick={(e) => {e.stopPropagation(); setDetalheJogador(null);}} className="text-slate-500 font-black text-xl hover:text-white transition-colors">✕</button>
                           </div>
                           <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-amber-500/20 text-center shadow-inner">
                              <p className="text-6xl font-black text-amber-500 tracking-[0.3em] font-mono shadow-amber-900/10 drop-shadow-lg">{detalheJogador.pin_pessoal}</p>
                           </div>
                           <button onClick={(e) => {e.stopPropagation(); setDetalheJogador(null);}} className="w-full mt-6 bg-slate-900 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest border border-slate-700">{T.close}</button>
                        </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-600 uppercase ml-4 tracking-widest italic">{isAdmin ? T.historyGlobal : T.historyPersonal}</h4>
             <div className="space-y-2">
                {transacoes.length === 0 && <p className="text-center py-6 text-slate-700 text-xs font-bold uppercase">{T.noActivity}</p>}
                {transacoes.map(t => (
                  <div key={t.id} className="bg-slate-800/40 p-5 rounded-[2rem] flex justify-between items-center border border-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 w-10 h-10 rounded-2xl font-black italic text-[10px] flex items-center justify-center ${ (t.de === loggedInJogador.nome || (isAdmin && t.de === 'BANCO')) ? 'bg-red-400/10 text-red-500' : 'bg-emerald-400/10 text-emerald-500'}`}>
                        { (t.de === loggedInJogador.nome || (isAdmin && t.de === 'BANCO')) ? 'OUT' : 'IN'}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-tighter italic">{t.de} 👉 {t.para}</p>
                        <p className="text-[8px] text-slate-600 font-bold uppercase">{new Date(t.data).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black italic ${ (t.para === loggedInJogador.nome || (isAdmin && t.para === 'BANCO')) ? 'text-emerald-500' : 'text-red-500'}`}>M$ {t.valor.toLocaleString()}</p>
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

      {showModal && <TransferModal jogadores={jogo.jogadores} loggedInJogador={loggedInJogador} isAdmin={isAdmin} onClose={() => setShowModal(false)} onTransfer={executarTransferencia} />}
    </div>
  );
}
