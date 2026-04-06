import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

const API_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

export default function Jogos() {
  const [jogos, setJogos] = useState([]);
  const [nome, setNome] = useState("");

  async function carregarJogos() {
    const res = await fetch(`${API_URL}/jogos`);
    const data = await res.json();
    setJogos(data);
  }

  async function criarJogo() {
    await fetch(`${API_URL}/jogos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome }),
    });

    setNome("");
    carregarJogos();
  }

  useEffect(() => {
    carregarJogos();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎲 BoardPay</h1>

      {/* Criar jogo */}
      <div className="flex gap-2 mb-6">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do jogo"
          className="flex-1 px-4 py-2 rounded-xl bg-slate-700 outline-none"
        />
        <Button onClick={criarJogo}>Criar</Button>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {jogos.map((jogo) => (
          <Card key={jogo.id}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{jogo.nome}</h2>
                <p className="text-sm text-slate-400">
                  Criado em:{" "}
                  {jogo.data_criacao
                    ? new Date(jogo.data_criacao).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>

              <Button>Entrar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
