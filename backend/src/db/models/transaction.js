import { DataTypes } from 'sequelize';

/**
 * Sequelize model for a payment transaction.
 *
 * Complex/nested fields (amount, payer, history) are stored as native JSON /
 * scalar columns so the resulting object shape matches the in-memory store
 * exactly, keeping the two backends swappable.
 */
export function defineTransaction(sequelize) {
  const isSqlite = sequelize.getDialect() === 'sqlite';

  const Transaction = sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        allowNull: false,
      },
      partnerReferenceNo: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        field: 'partner_reference_no',
      },
      merchantRefNo: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'merchant_ref_no',
      },
      danaReferenceNo: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'dana_reference_no',
      },
      amountValue: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        field: 'amount_value',
      },
      refundedAmount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'refunded_amount',
      },
      currency: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: 'IDR',
      },
      // ENUM is MySQL-specific; SQLite uses a plain string with app-level checks.
      status: isSqlite
        ? { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'PENDING' }
        : {
            type: DataTypes.ENUM(
              'PENDING',
              'SUCCESS',
              'FAILED',
              'EXPIRED',
              'CANCELLED',
              'REFUNDED',
            ),
            allowNull: false,
            defaultValue: 'PENDING',
          },
      qrContent: { type: DataTypes.TEXT, allowNull: true, field: 'qr_content' },
      qrUrl: { type: DataTypes.STRING(512), allowNull: true, field: 'qr_url' },
      validUntil: { type: DataTypes.DATE, allowNull: true, field: 'valid_until' },
      payer: { type: DataTypes.JSON, allowNull: true },
      description: { type: DataTypes.STRING(255), allowNull: true },
      customerName: { type: DataTypes.STRING(128), allowNull: true, field: 'customer_name' },
      history: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    },
    {
      tableName: 'transactions',
      underscored: true,
      timestamps: true,
    },
  );

  return Transaction;
}
