import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function InviteHandler() {
  const { id, pin } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Processando Convite:", { id, pin });
    if (id && pin) {
      // 🛡️ SALVA O PIN DE ENTRADA AUTOMÁTICO NA SESSÃO
      sessionStorage.clear(); // Limpa sessões antigas para evitar conflito
      sessionStorage.setItem(`game_pin_entry_${id}`, pin);
      
      // Pequeno delay para garantir o storage antes de navegar
      setTimeout(() => {
        navigate(`/jogo/${id}`);
      }, 100);
    } else {
      navigate('/');
    }
  }, [id, pin, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-black uppercase text-xs tracking-widest animate-pulse">Entrando na Mesa...</p>
    </div>
  );
}
