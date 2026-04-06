import { useState } from "react";

export default function TransferModal({ jogadores, onClose, onTransfer }) {
  const [de, setDe] = useState("");
  const [para, setPara] = useState("");
  const [valor, setValor] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-slate-900 p-6 rounded-2xl w-96">
        <h2 className="text-xl font-bold mb-4">Transferência</h2>

        <select
          onChange={(e) => setDe(e.target.value)}
          className="w-full mb-2 p-2 bg-slate-800 rounded"
        >
          <option>De</option>
          {jogadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nome}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => setPara(e.target.value)}
          className="w-full mb-2 p-2 bg-slate-800 rounded"
        >
          <option>Para</option>
          {jogadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nome}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full mb-4 p-2 bg-slate-800 rounded"
        />

        <button
          onClick={() => onTransfer({ de, para, valor })}
          className="w-full bg-purple-600 py-2 rounded-xl"
        >
          Enviar
        </button>

        <button onClick={onClose} className="w-full mt-2 text-sm text-gray-400">
          Cancelar
        </button>
      </div>
    </div>
  );
}
