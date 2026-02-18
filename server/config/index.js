
const frontendUrl =  process.env.FRONTEND_URL || 'http://localhost:5173',
    port = process.env.PORT || 3000,
    ds_key = "sk-97c26fa1df004eb8894e34eec7986997";
    
const geminiConfig = {
            apiKey: "sk-DJa9yEvSOxG9G6haVkgx06UgRAysBnMALIrnX5oqK8ApFElQ",
            apiUrl: 'https://api.sydney-ai.com/v1',
            model: 'gemini-3-pro-all'
        };
const serverState = 'test';
let config = {
    dev: {
        port,
        frontendUrl,
        ds_key,
        geminiConfig,
        serverState
    },
    production: {
        port,
        frontendUrl,
        ds_key,
        geminiConfig,
        serverState
    }
}
export default config[process.env.NODE_ENV || 'dev'];