import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');

console.log('\n🛡️ Starting TallerPro Security & Privacy Audit Agent...');
console.log('───────────────────────────────────────────────────');

const findings = [];

// 1. Check for localStorage without encryption/masking
const checkLocalStorage = () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    const files = fs.readdirSync(srcDir, { recursive: true });
    
    files.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
            if (content.includes('localStorage.setItem') && !content.includes('JSON.stringify')) {
                findings.push(`[PRIVACY] Direct localStorage usage found in ${file}. Ensure data is masked or encrypted.`);
            }
        }
    });
};

// 2. Check for unprotected routes in App.jsx
const checkRoutes = () => {
    const appPath = path.join(ROOT_DIR, 'src/App.jsx');
    if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        const sensitiveRoutes = ['/dashboard', '/tech'];
        sensitiveRoutes.forEach(route => {
            if (content.includes(`path="${route}"`) && !content.includes('ProtectedRoute')) {
                findings.push(`[SECURITY] Sensitive route ${route} is not protected in App.jsx.`);
            }
        });
    }
};

// 3. Check for sequential ID patterns in mockDb.js
const checkDbIds = () => {
    const dbPath = path.join(ROOT_DIR, 'src/services/mockDb.js');
    if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, 'utf8');
        if (content.includes('`TKT-${String(tickets.length + 1).padStart(3, \'0\')}`')) {
            findings.push(`[SECURITY] Sequential Ticket ID generation found in mockDb.js. Use obfuscated IDs.`);
        }
    }
};

// 4. Check for Google OAuth Configuration
const checkGoogleAuth = () => {
    const envPath = path.join(ROOT_DIR, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        if (content.includes('VITE_GOOGLE_CLIENT_ID=your-client-id-here')) {
            findings.push(`[SECURITY] Google Client ID is still using the placeholder in .env.`);
        }
    } else {
        findings.push(`[SECURITY] .env file is missing. Google OAuth requires VITE_GOOGLE_CLIENT_ID.`);
    }
};

checkLocalStorage();
checkRoutes();
checkDbIds();
checkGoogleAuth();

if (findings.length > 0) {
    console.log('\n❌ Audit Failed. Identified Issues:');
    findings.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
} else {
    console.log('\n✅ Audit Passed. No major security or privacy issues identified.');
    process.exit(0);
}
