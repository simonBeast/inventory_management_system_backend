'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      productSubCategoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'productsubcategories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      quantity: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      reservedSalePrice: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'fulfilled', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      note: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('reservations', ['productId', 'status'], {
      name: 'reservations_product_status_index'
    });
    await queryInterface.addIndex('reservations', ['productSubCategoryId', 'status'], {
      name: 'reservations_subcategory_status_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('reservations', 'reservations_product_status_index');
    await queryInterface.removeIndex('reservations', 'reservations_subcategory_status_index');
    await queryInterface.dropTable('reservations');
  }
};
