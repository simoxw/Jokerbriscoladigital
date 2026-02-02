
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("\x1b[36m%s\x1b[0m", "🃏 JOKER BRISCOLA - Launcher");

// 1. Controllo e Installazione Automatica Dipendenze
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log("\x1b[33m%s\x1b[0m", "📦 Primo avvio rilevato: Installazione delle librerie in corso...");
    console.log("    Attendi qualche istante (potrebbe richiedere 1-2 minuti)...");
    
    try {
        // Determina il comando corretto per Windows (npm.cmd) o Linux/Mac (npm)
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        
        // Esegue l'installazione bloccando il processo finché non finisce
        execSync(`${npmCmd} install`, { stdio: 'inherit' });
        
        console.log("\x1b[32m%s\x1b[0m", "✅ Installazione completata! Avvio del gioco...");
    } catch (error) {
        console.error("\x1b[31m%s\x1b[0m", "❌ Errore durante l'installazione delle librerie.");
        console.error("Prova a eseguire manualmente il comando: npm install");
        process.exit(1);
    }
}

// 2. Avvio Server Backend
console.log("\x1b[33m%s\x1b[0m", "🚀 Avvio Server Backend (Porta 3000)...");
const server = spawn('node', ['server.js'], { 
    stdio: 'inherit', 
    shell: true 
});

// 3. Avvio Frontend (Vite)
console.log("\x1b[32m%s\x1b[0m", "🌐 Avvio Sito Web (Vite)...");
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const client = spawn(npxCmd, ['vite'], { 
    stdio: 'inherit', 
    shell: true 
});

// Gestione chiusura pulita (CTRL+C)
process.on('SIGINT', () => {
    console.log("\n\x1b[31m%s\x1b[0m", "🛑 Arresto sistema...");
    server.kill();
    client.kill();
    process.exit();
});
