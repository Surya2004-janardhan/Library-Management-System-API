const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Member = sequelize.define(
  "Member",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    membership_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("active", "suspended"),
      defaultValue: "active",
    },
  },
  {
    tableName: "members",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["email"] }, { fields: ["membership_number"] }],
  }
);

module.exports = Member;
