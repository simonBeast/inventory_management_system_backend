'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sales', 'reservationId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'reservations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('sales', 'reservedQuantityUsed', {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addIndex('sales', ['reservationId'], {
      name: 'sales_reservation_id_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sales', 'sales_reservation_id_index');
    await queryInterface.removeColumn('sales', 'reservedQuantityUsed');
    await queryInterface.removeColumn('sales', 'reservationId');
  }
};
