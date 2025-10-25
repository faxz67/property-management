const Sequelize = require('sequelize');
const { sequelize } = require('../config/database');
const { DataTypes } = Sequelize;
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'SUPER_ADMIN'),
    allowNull: false,
    defaultValue: 'ADMIN',
    validate: {
      isIn: [['ADMIN', 'SUPER_ADMIN']]
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'INACTIVE']]
    }
  }
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    }
  }
});

// Instance methods
Admin.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;

  // First try bcrypt compare (expected path)
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    if (isMatch) return true;
  } catch (_) {
    // ignore and attempt fallback below
  }

  // Fallback: if legacy records stored plaintext passwords, accept once and rehash
  if (candidatePassword === this.password) {
    this.password = await bcrypt.hash(candidatePassword, 12);
    await this.save();
    return true;
  }

  return false;
};

Admin.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Class methods
Admin.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

Admin.findActiveByEmail = function(email) {
  // Case-insensitive email lookup to avoid casing mismatches
  return this.findOne({ 
    where: { 
      email: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('email')),
        email.toLowerCase()
      ),
      status: 'ACTIVE' 
    } 
  });
};

module.exports = Admin;
