export const AppConfig = {
    // 🌍 CUSTOM URL:
    // Se você quiser forçar um endereço específico para o servidor Flask, digite aqui.
    // ✅ Formatos aceitos:
    //    "http://192.168.0.15:5000"   ← correto (com protocolo)
    //    "192.168.0.15:5000"          ← também funciona (http:// é adicionado automaticamente)
    // Se estiver vazio, o sistema vai detectar o IP automaticamente.
    customApiUrl: "",

    // 🌐 DEFAULT URL:
    // Captura automaticamente o endereço de onde o dispositivo está acessando o servidor.
    // ⚠️ Se você tiver VPN ativa, o Flask pode aparecer com o IP da VPN (ex: 10.x.x.x).
    //    Nesse caso, use customApiUrl acima para forçar o IP do hotspot (ex: 192.168.x.x).
    get defaultApiUrl() {
        // Em modo dev (porta 3000), aponta para o backend (porta 5000)
        // Preserva o IP real de onde o browser abriu, sem hardcoded localhost
        if (window.location.port === "3000") {
            return `http://${window.location.hostname}:5000`;
        }
        return window.location.origin;
    },

    // 🔗 API_URL (usado pelo sistema):
    // Normaliza a URL customizada adicionando http:// se necessário.
    get apiUrl() {
        const raw = this.customApiUrl.trim();
        if (!raw) return this.defaultApiUrl;

        // Adiciona http:// se o usuário esqueceu o protocolo
        if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
            return `http://${raw}`;
        }
        return raw;
    }
};
