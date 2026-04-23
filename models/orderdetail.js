'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      OrderDetail.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "Order"
      })
      // define association here
    }
  }
  OrderDetail.init({
    orderId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    productName: DataTypes.STRING,
    productPrice: DataTypes.DECIMAL,
    qty: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'OrderDetail',
  });
  return OrderDetail;
};