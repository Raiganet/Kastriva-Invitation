import { loadProjectEnv, validateEnvironment } from './env-tools.mjs';
const mode = process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || process.env.NODE_ENV || 'development';
const { errors, config } = validateEnvironment(loadProjectEnv({ mode }));
if (errors.length) { for (const error of errors) console.error('ERROR: ' + error); process.exitCode = 1; }
else console.log(config ? 'PASS: format environment valid. Koneksi/Auth/SQL belum diuji.' : 'PASS: mode demo tanpa backend. Tidak ada data pelanggan yang disimpan.');
