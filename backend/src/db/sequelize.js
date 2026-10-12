import { Sequelize } from 'sequelize';
import config from '../config/index.js';
import { defineTransaction } from './models/transaction.js';

/**
 * MySQL connection via Sequelize. Only initialised when DB_ENABLED=true and a
 * host is configured. When disabled the app falls back to the in-memory store,
 * so the project still runs with zero setup.
 */
let sequelize = null;
let Transaction = null;

export function isDbEnabled() {
  return Boolean(config.db.enabled && config.db.host);
}

export function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      logging: config.db.logging ? (msg) => console.log(`[sql] ${msg}`) : false,
      pool: { max: 5, min: 0, idle: 10_000 },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    });
    Transaction = defineTransaction(sequelize);
  }
  return sequelize;
}

export function getTransactionModel() {
  if (!Transaction) getSequelize();
  return Transaction;
}

/** Connect, verify, and sync the schema. Throws on failure. */
export async function initDb() {
  const s = getSequelize();
  await s.authenticate();
  await s.sync({ alter: config.db.syncAlter });
  return s;
}

export async function closeDb() {
  if (sequelize) await sequelize.close();
}
