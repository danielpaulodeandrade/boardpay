import { useState, useEffect } from "react";

export default function TransferModal({ jogadores, loggedInJogador, isAdmin, onClose, onTransfer }) {
  const [valor, setValor] = useState("");
  const [de, setDe] = useState("");
  const [para, setPara] = useState("");
  
  // Controle de Confirmação de PIN
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pinConfirmInput, setPinConfirmInput] = useState("");

  useEffect(() => {
    if (isAdmin) {
      setDe("BANCO");
    } else if (loggedInJogador) {
      setDe(loggedInJogador.id);
    }
  }, [isAdmin, loggedInJogador]);

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!valor || valor <= 0) {
      alert("Digite um valor válido.");
      return;
    }
    if (!de || !para) {
      alert("Selecione o destino.");
      return;
    }
    if (de === para) {
      alert("Origem e destino iguais.");
      return;
    }

    // Se for Admin, passa direto. Se for Jogador, pede o PIN.
    if (isAdmin) {
      onTransfer({ de, para, valor });
    } else {
      setShowPinConfirm(true);
    }
  };

  const handleFinalConfirm = (e) => {
    e.preventDefault();
    if (pinConfirmInput.length < 4) {
      alert("Digite seu PIN de 4 dígitos.");
      return;
    }
    onTransfer({ de, para, valor, pin_pessoal: pinConfirmInput });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-md bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-10"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="ml-1">
            <h2 className="text-3xl font-black text-white leading-tight">
               {showPinConfirm ? "Validar PIN" : "Pagamento"}
            </h2>
            <p className="text-purple-400 text-[10px] uppercase tracking-[0.3em] font-black italic opacity-80">
               {showPinConfirm ? "Segurança BoardPay" : "Instantâneo"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90 shadow-inner"
          >
            ✕
          </button>
        </div>

        {!showPinConfirm ? (
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* VALOR */}
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl italic group-focus-within:text-purple-500 transition-colors">M$</span>
                <input
                  type="number"
                  value={valor}
                  autoFocus
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-900 border border-slate-700/50 pl-16 pr-6 py-6 rounded-3xl text-4xl font-black text-white outline-none focus:ring-2 ring-purple-600/50 transition-all text-center placeholder:opacity-20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                  <label className="block text-slate-600 text-[9px] uppercase tracking-widest font-black mb-1 px-1">Pagador</label>
                  <div className="flex items-center gap-3 p-1">
                     <span className="text-2xl">{isAdmin ? '🏦' : (jogadores.find(j => j.id === de)?.avatar || '👤')}</span>
                     <span className="text-white font-black uppercase italic tracking-tighter">{isAdmin ? 'BANCO CENTRAL' : (jogadores.find(j => j.id === de)?.nome || 'VOCÊ')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[9px] uppercase tracking-widest font-black mb-2 ml-2">Recebedor:</label>
                  <select 
                    value={para} 
                    onChange={(e) => setPara(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 p-5 rounded-2xl text-white font-black uppercase italic tracking-tight outline-none appearance-none focus:ring-2 ring-purple-500 shadow-xl"
                  >
                    <option value="">Selecione...</option>
                    {!isAdmin && <option value="BANCO" className="text-emerald-400">🏦 BANCO CENTRAL</option>}
                    {jogadores.filter(j => j.id !== de).map(j => (
                        <option key={j.id} value={j.id}>{j.avatar} {j.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-5 rounded-3xl text-white font-black text-lg shadow-xl shadow-purple-900/40 active:scale-[0.98] mt-6 uppercase tracking-widest">
              CONFIRMAR DESTINO 🚀
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalConfirm} className="space-y-6 animate-in fade-in zoom-in-95">
             <div className="p-6 bg-slate-900 rounded-[2.5rem] border border-slate-700 shadow-inner text-center space-y-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                   Autorizando transferência de <br/>
                   <span className="text-white font-black text-lg">M$ {Number(valor).toLocaleString()}</span> <br/>
                   para <span className="text-purple-400 font-black italic">{para === 'BANCO' ? 'BANCO CENTRAL' : jogadores.find(j => j.id === para)?.nome}</span>
                </p>
                <div className="relative">
                   <input 
                      type="password" 
                      maxLength={4} 
                      autoFocus
                      placeholder="••••"
                      value={pinConfirmInput}
                      onChange={(e) => setPinConfirmInput(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 p-6 rounded-3xl text-4xl text-center font-black tracking-[0.5em] text-white outline-none focus:ring-2 ring-emerald-500 shadow-xl"
                   />
                </div>
             </div>
             
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPinConfirm(false)}
                  className="flex-1 py-5 bg-slate-700 rounded-3xl text-white font-black uppercase text-xs tracking-widest"
                >
                  VOLTAR
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-5 bg-emerald-600 rounded-3xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/40 active:scale-95 transition-all"
                >
                  PAGAR AGORA 💸
                </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
}
