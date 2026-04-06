export default function SaldoCard({ valor }) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-xl">
      <p className="text-sm text-purple-200">Saldo total</p>

      <h1 className="text-3xl font-bold mt-2">R$ {valor.toFixed(2)}</h1>
    </div>
  );
}
