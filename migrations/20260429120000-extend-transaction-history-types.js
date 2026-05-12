'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('transactionhistories', 'transactionType', {
      type: Sequelize.ENUM(
        'sale',
        'return',
        'stock_in',
        'stock_out',
        'sale_update',
        'sale_cancel',
        'return_update',
        'return_cancel'
      ),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('transactionhistories', 'transactionType', {
      type: Sequelize.ENUM('sale', 'return'),
      allowNull: false
    });
  }
};
