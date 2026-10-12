import { Sequelize } from 'sequelize';
import config from '../config/index.js';
import { defineTransaction } from './models/transaction.js';

/**
 * Database connection via Sequelize (MySQL by default, SQLite for tests).
 * Only initialised when DB_ENABLED=true and a host is configured. When disabled
 * the app falls back to the in-memory store, so the project still runs with no
 * setup.
 */
let sequelize = null;
let Transaction = null;

export function isDbEnabled() {
  // sqlite needs no host; mysql/others require one.
  const needsHost = config.db.dialect !== 'sqlite';
  return Boolean(config.db.enabled && (!needsHost || config.db.host));
}

export function getSequelize() {
  if (!sequelize) {
    const common = {
      dialect: config.db.dialect,
      logging: config.db.logging ? (msg) => console.log(`[sql] ${msg}`) : false,
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    };

    if (config.db.dialect === 'sqlite') {
      sequelize = new Sequelize({
        ...common,
        storage: config.db.storage,
        define: {},
      });
    } else {
      sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
        ...common,
        host: config.db.host,
        port: config.db.port,
        pool: { max: 5, min: 0, idle: 10_000 },
      });
    }

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
