const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Fine = sequelize.define(
  "Fine",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "members",
        key: "id",
      },
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "transactions",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "fines",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["member_id"] }, { fields: ["paid_at"] }],
  }
);

module.exports = Fine;
