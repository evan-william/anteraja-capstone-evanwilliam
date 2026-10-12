import { startApp } from './server.js';

const app = await startApp(Number(process.env.APP_PORT || 3121));
console.log(`Shipment Request: ${app.baseUrl}/shipment-form.html`);
console.log('Ctrl+C menghentikan server latihan ini.');
process.on('SIGINT', () => { app.stop(); process.exit(0); });
process.on('SIGTERM', () => { app.stop(); process.exit(0); });
app.child.on('exit', code => { process.exitCode = code || 0; });
