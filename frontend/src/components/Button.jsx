export default function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-semibold transition"
    >
      {children}
    </button>
  );
}
