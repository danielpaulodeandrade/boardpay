import { useEffect, useState } from "react";
import SaldoCard from "../components/SaldoCard";
import JogadorCard from "../components/JogadorCard";
import TransferModal from "../components/TransferModal";

const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

export default function JogoDetalhe() {
  const [jogadores, setJogadores] = useState([]);
  const [showModal, setShowModal] = useState(false);

  async function carregar() {
    const res = await fetch(`${API_URL}/jogadores`);
    const data = await res.json();
    setJogadores(data);
  }

  async function transferir({ de, para, valor }) {
    await fetch(`${API_URL}/transacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        de_jogador_id: de,
        para_jogador_id: para,
        valor: Number(valor),
      }),
    });

    setShowModal(false);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  const saldoTotal = jogadores.reduce((acc, j) => acc + j.saldo, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <SaldoCard valor={saldoTotal} />

      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-purple-600 py-3 rounded-xl"
      >
        Nova Transferência
      </button>

      {jogadores.map((j) => (
        <JogadorCard key={j.id} jogador={j} />
      ))}

      {showModal && (
        <TransferModal
          jogadores={jogadores}
          onClose={() => setShowModal(false)}
          onTransfer={transferir}
        />
      )}
    </div>
  );
}
