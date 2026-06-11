import fs from 'fs';
import path from 'path';
import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
let pool = null;

if (databaseUrl) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
}

// ─── Auth Token Helpers ────────────────────────────────────────────
const AUTH_SECRET = process.env.AUTH_SECRET || 'tallerpro_dev_secret_change_in_production';
const TOKEN_TTL_SECONDS = 86400; // 24 hours

export function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
}

// ─── Password Helpers ──────────────────────────────────────────────
const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Pre-hashed passwords for seed data (generated with bcrypt rounds=10)
// These are computed once at module load to avoid blocking on every cold start
let seedAdminHash = null;
let seedTechHash = null;

async function getSeedHashes() {
  if (!seedAdminHash) {
    seedAdminHash = await hashPassword('tallerpro2026');
    seedTechHash = await hashPassword('techpro2026');
  }
  return { seedAdminHash, seedTechHash };
}

// ─── Secure ID Generation ──────────────────────────────────────────
export function generateSecureId(prefix = '') {
  const id = crypto.randomBytes(6).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${id}` : id;
}

// ─── Auth Check (Token-Based) ──────────────────────────────────────
export function checkAuth(req, allowedRoles = []) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload) return null;
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) return null;

  return payload; // { id, role, email, exp }
}

// ─── Fallback JSON DB ──────────────────────────────────────────────
const isVercel = process.env.VERCEL || process.env.NOW_BUILD;
const localDbPath = isVercel 
  ? path.join('/tmp', 'db.json')
  : path.join(process.cwd(), 'db.json');

// Default Seed Data
const defaultSettings = {
  name: 'TallerPro',
  logo: '',
  phone: '526633040096',
  address: 'Av. de la Reforma 123, Ciudad de México',
  rfc: 'TPRO120409AA1',
  defaultIva: 16
};

const defaultTickets = [
  { 
    id: 'TKT-X821', 
    client: 'Juan Pérez', 
    vehicle: 'Toyota Corolla 2020', 
    serviceType: 'Mecánica', 
    status: 'Recepción', 
    events: [1], 
    photos: {},
    items: [],
    billingInfo: { rfc: '', zip: '', regime: '601', usage: 'G03' },
    phone: '526633040096',
    email: 'juan.perez@example.com',
    clientPhoto: '',
    vehiclePhoto: '',
    budgetStatus: 'pending',
    damagedPanels: [],
    insuranceType: 'particular',
    insuranceCompany: '',
    claimNumber: '',
    signatureIntake: '',
    signatureDelivery: '',
    timeLogs: { "Recepción": 900 },
    inventoryChecklist: {},
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    closedAt: null
  },
  { 
    id: 'TKT-Z493', 
    client: 'María Gómez', 
    vehicle: 'Honda Civic 2019', 
    serviceType: 'Hojalatería y Pintura', 
    status: 'Pintura', 
    events: [1, 2, 3], 
    photos: {},
    items: [
      { id: 1, desc: 'Reparación de Fascia Trasera', qty: 1, price: 4500, type: 'Mano de Obra', satKey: '78181500' },
      { id: 2, desc: 'Pintura Bicapa (Color Match)', qty: 1, price: 3200, type: 'Refacción', satKey: '31211500' }
    ],
    billingInfo: { rfc: 'XAXX010101000', zip: '06600', regime: '612', usage: 'G03' },
    phone: '526633040096',
    email: 'maria.gomez@example.com',
    clientPhoto: '',
    vehiclePhoto: '',
    budgetStatus: 'approved',
    damagedPanels: [{ panelId: 'rear-bumper', damageLevel: 'HIGH' }, { panelId: 'trunk', damageLevel: 'MEDIUM' }],
    insuranceType: 'aseguranza',
    insuranceCompany: 'Qualitas',
    claimNumber: 'SIN-982405',
    signatureIntake: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAYAAAB1ov4vAAAABmJLR0QA/wD/AP+gvaeTAAAAcElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgbNbgAAT/547kAAAAASUVORK5CYII=',
    signatureDelivery: '',
    timeLogs: { "Recepción": 1200, "Hojalatería": 3600, "Pintura": 2400 },
    inventoryChecklist: {},
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    closedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const defaultParts = [
  {
    id: 'PRT-W912',
    name: 'Amortiguadores Delanteros (Par)',
    brand: 'Bilstein',
    qty: 1,
    vehicleCompatibility: 'Toyota Corolla 2020',
    ticketId: 'TKT-X821',
    status: 'approved',
    qcNotes: 'Llegó en excelentes condiciones, empaque original sellado. Verificado con número de serie.',
    photo: '',
    qcChecked: { visual: true, packaging: true, compatibility: true, functional: true },
    inspectedBy: 'Técnico Principal',
    inspectedAt: new Date(Date.now() - 86400000).toISOString(),
    cost: 1800,
    salePrice: 2800
  },
  {
    id: 'PRT-K302',
    name: 'Faro Principal Izquierdo',
    brand: 'TYC',
    qty: 1,
    vehicleCompatibility: 'Honda Civic 2019',
    ticketId: 'TKT-Z493',
    status: 'rejected',
    qcNotes: 'El faro llegó quebrado en el soporte inferior derecho. Se solicita devolución al proveedor.',
    photo: '',
    qcChecked: { visual: false, packaging: true, compatibility: true, functional: false },
    inspectedBy: 'Técnico Carrocería',
    inspectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    cost: 950,
    salePrice: 1600
  },
  {
    id: 'PRT-H741',
    name: 'Bomba de Agua y empaque',
    brand: 'Gates',
    qty: 1,
    vehicleCompatibility: 'Toyota Corolla 2020',
    ticketId: 'TKT-X821',
    status: 'pending',
    qcNotes: '',
    photo: '',
    qcChecked: { visual: false, packaging: false, compatibility: false, functional: false },
    inspectedBy: '',
    inspectedAt: '',
    cost: 550,
    salePrice: 1100
  }
];

// ─── PostgreSQL Initialization ─────────────────────────────────────
let isDbInitialized = false;
async function initializePostgres() {
  if (isDbInitialized || !pool) return;
  
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        client TEXT,
        vehicle TEXT,
        serviceType TEXT,
        status TEXT,
        events TEXT,
        photos TEXT,
        items TEXT,
        billingInfo TEXT,
        phone TEXT,
        budgetStatus TEXT,
        damagedPanels TEXT,
        insuranceType TEXT,
        insuranceCompany TEXT,
        claimNumber TEXT,
        signatureIntake TEXT,
        signatureDelivery TEXT,
        timeLogs TEXT,
        inventoryChecklist TEXT,
        createdAt TEXT,
        closedAt TEXT,
        email TEXT,
        clientPhoto TEXT,
        vehiclePhoto TEXT
      );
      
      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY,
        name TEXT,
        brand TEXT,
        qty INTEGER,
        vehicleCompatibility TEXT,
        ticketId TEXT,
        status TEXT,
        qcNotes TEXT,
        photo TEXT,
        qcChecked TEXT,
        inspectedBy TEXT,
        inspectedAt TEXT,
        cost REAL,
        salePrice REAL
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        picture TEXT,
        role TEXT
      );
    `);

    // Run alterations to guarantee columns exist on pre-existing ticket tables
    await pool.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS clientPhoto TEXT;
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS vehiclePhoto TEXT;
    `);
    
    // Seed settings if empty
    const checkSettings = await pool.query('SELECT count(*) FROM settings');
    if (parseInt(checkSettings.rows[0].count) === 0) {
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2)',
        ['tallerpro_settings', JSON.stringify(defaultSettings)]
      );
    }
    
    // Seed tickets if empty
    const checkTickets = await pool.query('SELECT count(*) FROM tickets');
    if (parseInt(checkTickets.rows[0].count) === 0) {
      for (const t of defaultTickets) {
        await pool.query(
          `INSERT INTO tickets (
            id, client, vehicle, serviceType, status, events, photos, items, billingInfo, phone,
            budgetStatus, damagedPanels, insuranceType, insuranceCompany, claimNumber,
            signatureIntake, signatureDelivery, timeLogs, inventoryChecklist, createdAt, closedAt,
            email, clientPhoto, vehiclePhoto
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            t.id, t.client, t.vehicle, t.serviceType, t.status, JSON.stringify(t.events),
            JSON.stringify(t.photos), JSON.stringify(t.items), JSON.stringify(t.billingInfo),
            t.phone, t.budgetStatus, JSON.stringify(t.damagedPanels), t.insuranceType,
            t.insuranceCompany, t.claimNumber, t.signatureIntake, t.signatureDelivery,
            JSON.stringify(t.timeLogs), JSON.stringify(t.inventoryChecklist), t.createdAt, t.closedAt,
            t.email || '', t.clientPhoto || '', t.vehiclePhoto || ''
          ]
        );
      }
    }
    
    // Seed parts if empty
    const checkParts = await pool.query('SELECT count(*) FROM parts');
    if (parseInt(checkParts.rows[0].count) === 0) {
      for (const p of defaultParts) {
        await pool.query(
          `INSERT INTO parts (
            id, name, brand, qty, vehicleCompatibility, ticketId, status, qcNotes, photo,
            qcChecked, inspectedBy, inspectedAt, cost, salePrice
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            p.id, p.name, p.brand, p.qty, p.vehicleCompatibility, p.ticketId, p.status,
            p.qcNotes, p.photo, JSON.stringify(p.qcChecked), p.inspectedBy, p.inspectedAt,
            p.cost, p.salePrice
          ]
        );
      }
    }

    // Seed users if empty (with hashed passwords)
    const checkUsers = await pool.query('SELECT count(*) FROM users');
    if (parseInt(checkUsers.rows[0].count) === 0) {
      const { seedAdminHash, seedTechHash } = await getSeedHashes();
      await pool.query(
        `INSERT INTO users (id, name, email, password, picture, role) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['demo_admin', 'Admin Demo', 'admin@tallerpro.com', seedAdminHash, 'https://ui-avatars.com/api/?name=Admin+Demo&background=00f2ff&color=000', 'admin']
      );
      await pool.query(
        `INSERT INTO users (id, name, email, password, picture, role) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['demo_tech', 'Técnico Demo', 'tech@tallerpro.com', seedTechHash, 'https://ui-avatars.com/api/?name=Tecnico+Demo&background=b512fa&color=fff', 'mechanic']
      );
    }

    isDbInitialized = true;
  } catch (err) {
    console.error('[DB] Postgres init failed:', err.message);
  }
}

// ─── Local JSON DB ─────────────────────────────────────────────────
function readLocalJson() {
  if (!fs.existsSync(localDbPath)) {
    // Hash passwords synchronously for seed data
    const adminHash = bcrypt.hashSync('tallerpro2026', BCRYPT_ROUNDS);
    const techHash = bcrypt.hashSync('techpro2026', BCRYPT_ROUNDS);
    const initialData = {
      tickets: defaultTickets,
      parts: defaultParts,
      settings: defaultSettings,
      users: [
        { id: 'demo_admin', name: 'Admin Demo', email: 'admin@tallerpro.com', password: adminHash, picture: 'https://ui-avatars.com/api/?name=Admin+Demo&background=00f2ff&color=000', role: 'admin' },
        { id: 'demo_tech', name: 'Técnico Demo', email: 'tech@tallerpro.com', password: techHash, picture: 'https://ui-avatars.com/api/?name=Tecnico+Demo&background=b512fa&color=fff', role: 'mechanic' }
      ]
    };
    fs.writeFileSync(localDbPath, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(localDbPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      const adminHash = bcrypt.hashSync('tallerpro2026', BCRYPT_ROUNDS);
      const techHash = bcrypt.hashSync('techpro2026', BCRYPT_ROUNDS);
      parsed.users = [
        { id: 'demo_admin', name: 'Admin Demo', email: 'admin@tallerpro.com', password: adminHash, picture: 'https://ui-avatars.com/api/?name=Admin+Demo&background=00f2ff&color=000', role: 'admin' },
        { id: 'demo_tech', name: 'Técnico Demo', email: 'tech@tallerpro.com', password: techHash, picture: 'https://ui-avatars.com/api/?name=Tecnico+Demo&background=b512fa&color=fff', role: 'mechanic' }
      ];
      fs.writeFileSync(localDbPath, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    return { tickets: [], parts: [], settings: defaultSettings, users: [] };
  }
}

function writeLocalJson(data) {
  fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Ticket Operations ─────────────────────────────────────────────
export async function getTickets() {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT * FROM tickets');
      return res.rows.map(t => ({
        ...t,
        email: t.email || '',
        clientPhoto: t.clientphoto || '',
        vehiclePhoto: t.vehiclephoto || '',
        events: t.events ? JSON.parse(t.events) : [],
        photos: t.photos ? JSON.parse(t.photos) : {},
        items: t.items ? JSON.parse(t.items) : [],
        billingInfo: t.billinginfo ? JSON.parse(t.billinginfo) : { rfc: '', zip: '', regime: '601', usage: 'G03' },
        damagedPanels: t.damagedpanels ? JSON.parse(t.damagedpanels) : [],
        timeLogs: t.timelogs ? JSON.parse(t.timelogs) : {},
        inventoryChecklist: t.inventorychecklist ? JSON.parse(t.inventorychecklist) : {}
      }));
    } catch (err) {
      console.error('[DB] getTickets error:', err.message);
    }
  }
  return readLocalJson().tickets;
}

export async function getTicket(id) {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const t = res.rows[0];
      return {
        ...t,
        email: t.email || '',
        clientPhoto: t.clientphoto || '',
        vehiclePhoto: t.vehiclephoto || '',
        events: t.events ? JSON.parse(t.events) : [],
        photos: t.photos ? JSON.parse(t.photos) : {},
        items: t.items ? JSON.parse(t.items) : [],
        billingInfo: t.billinginfo ? JSON.parse(t.billinginfo) : { rfc: '', zip: '', regime: '601', usage: 'G03' },
        damagedPanels: t.damagedpanels ? JSON.parse(t.damagedpanels) : [],
        timeLogs: t.timelogs ? JSON.parse(t.timelogs) : {},
        inventoryChecklist: t.inventorychecklist ? JSON.parse(t.inventorychecklist) : {}
      };
    } catch (err) {
      console.error('[DB] getTicket error:', err.message);
    }
  }
  const tickets = readLocalJson().tickets;
  return tickets.find(t => t.id === id) || null;
}

export async function addTicket(t) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query(
        `INSERT INTO tickets (
          id, client, vehicle, serviceType, status, events, photos, items, billingInfo, phone,
          budgetStatus, damagedPanels, insuranceType, insuranceCompany, claimNumber,
          signatureIntake, signatureDelivery, timeLogs, inventoryChecklist, createdAt, closedAt,
          email, clientPhoto, vehiclePhoto
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          t.id, t.client, t.vehicle, t.serviceType, t.status, JSON.stringify(t.events),
          JSON.stringify(t.photos), JSON.stringify(t.items), JSON.stringify(t.billingInfo),
          t.phone, t.budgetStatus, JSON.stringify(t.damagedPanels), t.insuranceType,
          t.insuranceCompany, t.claimNumber, t.signatureIntake, t.signatureDelivery,
          JSON.stringify(t.timeLogs), JSON.stringify(t.inventoryChecklist), t.createdAt, t.closedAt,
          t.email || '', t.clientPhoto || '', t.vehiclePhoto || ''
        ]
      );
      return t;
    } catch (err) {
      console.error('[DB] addTicket error:', err.message);
    }
  }
  const data = readLocalJson();
  data.tickets.push(t);
  writeLocalJson(data);
  return t;
}

export async function updateTicket(id, fields) {
  if (pool) {
    await initializePostgres();
    try {
      const current = await getTicket(id);
      if (!current) return null;
      
      const merged = { ...current, ...fields };
      
      await pool.query(
        `UPDATE tickets SET 
          client = $1, vehicle = $2, serviceType = $3, status = $4, events = $5, photos = $6,
          items = $7, billingInfo = $8, phone = $9, budgetStatus = $10, damagedPanels = $11,
          insuranceType = $12, insuranceCompany = $13, claimNumber = $14, signatureIntake = $15,
          signatureDelivery = $16, timeLogs = $17, inventoryChecklist = $18, createdAt = $19, closedAt = $20,
          email = $21, clientPhoto = $22, vehiclePhoto = $23
         WHERE id = $24`,
        [
          merged.client, merged.vehicle, merged.serviceType, merged.status, JSON.stringify(merged.events),
          JSON.stringify(merged.photos), JSON.stringify(merged.items), JSON.stringify(merged.billingInfo),
          merged.phone, merged.budgetStatus, JSON.stringify(merged.damagedPanels), merged.insuranceType,
          merged.insuranceCompany, merged.claimNumber, merged.signatureIntake, merged.signatureDelivery,
          JSON.stringify(merged.timeLogs), JSON.stringify(merged.inventoryChecklist), merged.createdAt, merged.closedAt,
          merged.email || '', merged.clientPhoto || '', merged.vehiclePhoto || '',
          id
        ]
      );

      // CRM Sync: Update email, phone, clientPhoto, and vehiclePhoto across all tickets of this client
      if (fields.email !== undefined || fields.clientPhoto !== undefined || fields.vehiclePhoto !== undefined || fields.phone !== undefined) {
        const updates = [];
        const vals = [];
        let paramIndex = 1;
        if (fields.email !== undefined) {
          updates.push(`email = $${paramIndex++}`);
          vals.push(fields.email);
        }
        if (fields.clientPhoto !== undefined) {
          updates.push(`clientPhoto = $${paramIndex++}`);
          vals.push(fields.clientPhoto);
        }
        if (fields.vehiclePhoto !== undefined) {
          updates.push(`vehiclePhoto = $${paramIndex++}`);
          vals.push(fields.vehiclePhoto);
        }
        if (fields.phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`);
          vals.push(fields.phone);
        }
        vals.push(current.client);
        await pool.query(
          `UPDATE tickets SET ${updates.join(', ')} WHERE client = $${paramIndex}`,
          vals
        );
      }

      return merged;
    } catch (err) {
      console.error('[DB] updateTicket error:', err.message);
    }
  }
  
  const data = readLocalJson();
  const index = data.tickets.findIndex(t => t.id === id);
  if (index > -1) {
    const current = data.tickets[index];
    const merged = { ...current, ...fields };
    data.tickets[index] = merged;
    
    // CRM Sync for local json fallback:
    if (fields.email !== undefined || fields.clientPhoto !== undefined || fields.vehiclePhoto !== undefined || fields.phone !== undefined) {
      data.tickets.forEach(t => {
        if (t.client === current.client) {
          if (fields.email !== undefined) t.email = fields.email;
          if (fields.clientPhoto !== undefined) t.clientPhoto = fields.clientPhoto;
          if (fields.vehiclePhoto !== undefined) t.vehiclePhoto = fields.vehiclePhoto;
          if (fields.phone !== undefined) t.phone = fields.phone;
        }
      });
    }

    writeLocalJson(data);
    return merged;
  }
  return null;
}

export async function deleteTicket(id) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query('DELETE FROM tickets WHERE id = $1', [id]);
      await pool.query('DELETE FROM parts WHERE ticketId = $1', [id]);
      return true;
    } catch (err) {
      console.error('[DB] deleteTicket error:', err.message);
    }
  }
  const data = readLocalJson();
  data.tickets = data.tickets.filter(t => t.id !== id);
  data.parts = data.parts.filter(p => p.ticketId !== id);
  writeLocalJson(data);
  return true;
}

// ─── Parts Operations ──────────────────────────────────────────────
export async function getParts() {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT * FROM parts');
      return res.rows.map(p => ({
        ...p,
        qty: parseInt(p.qty) || 0,
        cost: parseFloat(p.cost) || 0,
        salePrice: parseFloat(p.saleprice) || 0,
        qcChecked: p.qcchecked ? JSON.parse(p.qcchecked) : { visual: false, packaging: false, compatibility: false, functional: false }
      }));
    } catch (err) {
      console.error('[DB] getParts error:', err.message);
    }
  }
  return readLocalJson().parts;
}

export async function addPart(p) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query(
        `INSERT INTO parts (
          id, name, brand, qty, vehicleCompatibility, ticketId, status, qcNotes, photo,
          qcChecked, inspectedBy, inspectedAt, cost, salePrice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          p.id, p.name, p.brand, p.qty, p.vehicleCompatibility, p.ticketId, p.status,
          p.qcNotes, p.photo, JSON.stringify(p.qcChecked), p.inspectedBy, p.inspectedAt,
          p.cost, p.salePrice
        ]
      );
      return p;
    } catch (err) {
      console.error('[DB] addPart error:', err.message);
    }
  }
  const data = readLocalJson();
  data.parts.push(p);
  writeLocalJson(data);
  return p;
}

export async function updatePart(id, fields) {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT * FROM parts WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const current = {
        ...res.rows[0],
        qty: parseInt(res.rows[0].qty) || 0,
        cost: parseFloat(res.rows[0].cost) || 0,
        salePrice: parseFloat(res.rows[0].saleprice) || 0,
        qcChecked: res.rows[0].qcchecked ? JSON.parse(res.rows[0].qcchecked) : { visual: false, packaging: false, compatibility: false, functional: false }
      };
      
      const merged = { ...current, ...fields };
      
      await pool.query(
        `UPDATE parts SET 
          name = $1, brand = $2, qty = $3, vehicleCompatibility = $4, ticketId = $5, status = $6,
          qcNotes = $7, photo = $8, qcChecked = $9, inspectedBy = $10, inspectedAt = $11, cost = $12, salePrice = $13
         WHERE id = $14`,
        [
          merged.name, merged.brand, merged.qty, merged.vehicleCompatibility, merged.ticketId, merged.status,
          merged.qcNotes, merged.photo, JSON.stringify(merged.qcChecked), merged.inspectedBy, merged.inspectedAt,
          merged.cost, merged.salePrice, id
        ]
      );
      return merged;
    } catch (err) {
      console.error('[DB] updatePart error:', err.message);
    }
  }
  
  const data = readLocalJson();
  const index = data.parts.findIndex(p => p.id === id);
  if (index > -1) {
    data.parts[index] = { ...data.parts[index], ...fields };
    writeLocalJson(data);
    return data.parts[index];
  }
  return null;
}

export async function deletePart(id) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query('DELETE FROM parts WHERE id = $1', [id]);
      return true;
    } catch (err) {
      console.error('[DB] deletePart error:', err.message);
    }
  }
  const data = readLocalJson();
  data.parts = data.parts.filter(p => p.id !== id);
  writeLocalJson(data);
  return true;
}

// ─── Settings Operations ───────────────────────────────────────────
export async function getSettings() {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT value FROM settings WHERE key = $1', ['tallerpro_settings']);
      if (res.rows.length > 0) {
        return JSON.parse(res.rows[0].value);
      }
    } catch (err) {
      console.error('[DB] getSettings error:', err.message);
    }
  }
  return readLocalJson().settings;
}

export async function saveSettings(settings) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['tallerpro_settings', JSON.stringify(settings)]
      );
      return settings;
    } catch (err) {
      console.error('[DB] saveSettings error:', err.message);
    }
  }
  
  const data = readLocalJson();
  data.settings = settings;
  writeLocalJson(data);
  return settings;
}

// ─── User Operations ───────────────────────────────────────────────
// PUBLIC: Returns user data WITHOUT password
export async function getUsers() {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT id, name, email, picture, role FROM users');
      return res.rows;
    } catch (err) {
      console.error('[DB] getUsers error:', err.message);
    }
  }
  return (readLocalJson().users || []).map(({ password, ...safe }) => safe);
}

// PUBLIC: Returns user data WITHOUT password
export async function getUserByEmail(email) {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT id, name, email, picture, role FROM users WHERE email = $1', [email]);
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch (err) {
      console.error('[DB] getUserByEmail error:', err.message);
    }
  }
  const users = readLocalJson().users || [];
  const found = users.find(u => u.email === email);
  if (!found) return null;
  const { password, ...safe } = found;
  return safe;
}

// INTERNAL: Returns user data WITH password hash (for auth only)
export async function getUserByEmailWithPassword(email) {
  if (pool) {
    await initializePostgres();
    try {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch (err) {
      console.error('[DB] getUserByEmailWithPassword error:', err.message);
    }
  }
  const users = readLocalJson().users || [];
  return users.find(u => u.email === email) || null;
}

export async function addUser(u) {
  if (pool) {
    await initializePostgres();
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password, picture, role) VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.id, u.name, u.email, u.password, u.picture, u.role]
      );
      const { password, ...safe } = u;
      return safe;
    } catch (err) {
      console.error('[DB] addUser error:', err.message);
    }
  }
  const data = readLocalJson();
  if (!data.users) data.users = [];
  data.users.push(u);
  writeLocalJson(data);
  const { password, ...safe } = u;
  return safe;
}
