'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
          'rent',
          'utilities',
          'transport',
          'salaries',
          'maintenance',
          'supplies',
          'equipment',
          'tax',
          'other'
        ),
        allowNull: true,
        defaultValue: 'other'
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      expenseDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('expenses', ['expenseDate'], {
      name: 'expenses_expenseDate_index'
    });
    await queryInterface.addIndex('expenses', ['category'], {
      name: 'expenses_category_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('expenses', 'expenses_expenseDate_index');
    await queryInterface.removeIndex('expenses', 'expenses_category_index');
    await queryInterface.dropTable('expenses');
  }
};
