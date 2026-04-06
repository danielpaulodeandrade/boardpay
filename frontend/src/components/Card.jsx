export default function Card({ children }) {
  return (
    <div className="bg-slate-800 p-4 rounded-2xl shadow-lg hover:shadow-xl transition">
      {children}
    </div>
  );
}
