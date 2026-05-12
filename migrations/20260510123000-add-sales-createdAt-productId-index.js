'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('sales', ['createdAt', 'productId'], {
      name: 'sales_createdAt_productId_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sales', 'sales_createdAt_productId_index');
  }
};
