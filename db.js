const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('uhditknow', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const User = sequelize.define('User', {
    usercode: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    grade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classno: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studentno: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    doorpermission: {
        type: DataTypes.TINYINT(1),
        allowNull: false
    }
}, {
    tableName: 'user',
    timestamps: false
});

const Cardkey = sequelize.define('Cardkey', {
    name: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    cardnum: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false
    },
    usercode: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'cardkey',
    timestamps: false
});

User.hasMany(Cardkey, { foreignKey: 'usercode' });
Cardkey.belongsTo(User, { foreignKey: 'usercode' });

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = { sequelize, User, Cardkey };
