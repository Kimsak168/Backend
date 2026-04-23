'use strict';
const {
  Model,
  or
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.Customer, {
        foreignKey: "customerId",
        as: "Customer"
      })
      Order.hasMany(models.OrderDetail, {
        foreignKey: "orderId",
        as: "OrderDetails"
      })
        Order.hasOne(models.Payment, {
          foreignKey: "orderId",
          as: "Payment"
        })
        // define association here
    }
  }
  Order.init({
    customerId: DataTypes.INTEGER,
    orderNumber: DataTypes.STRING,
    total: DataTypes.DECIMAL,
    discount: DataTypes.DECIMAL,
    orderDate: DataTypes.DATE,
    location: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};