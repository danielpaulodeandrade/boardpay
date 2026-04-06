export default function JogadorCard({ jogador, onSelect }) {
  return (
    <div
      onClick={() => onSelect(jogador)}
      className="bg-slate-800 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-700 transition"
    >
      <div>
        <h2 className="font-semibold">{jogador.nome}</h2>
        <p className="text-sm text-slate-400">Saldo</p>
      </div>

      <span className="font-bold text-green-400">
        R$ {jogador.saldo.toFixed(2)}
      </span>
    </div>
  );
}
