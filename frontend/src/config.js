export const AppConfig = {
    // 🌍 CUSTOM URL:
    // Se você quiser forçar um endereço específico para o servidor Flask, digite aqui.
    // Exemplo: "http://192.168.0.15:5000"
    // Se estiver vazio, o sistema vai usar a "Default URL"
    customApiUrl: "", 

    // 🌐 DEFAULT URL:
    // Captura automaticamente o endereço de onde o celular está acessando
    get defaultApiUrl() {
        return window.location.origin;
    },

    // 🔗 API_URL (usado pelo sistema):
    get apiUrl() {
        return this.customApiUrl || this.defaultApiUrl;
    }
};
