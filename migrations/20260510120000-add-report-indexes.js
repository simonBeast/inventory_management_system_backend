'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('sales', ['productId'], {
      name: 'sales_productId_index'
    });
    await queryInterface.addIndex('products', ['productSubCategoryId'], {
      name: 'products_productSubCategoryId_index'
    });
    await queryInterface.addIndex('productsubcategories', ['productCategoryId'], {
      name: 'productsubcategories_productCategoryId_index'
    });
    await queryInterface.addIndex('productcategories', ['categoryId'], {
      name: 'productcategories_categoryId_index'
    });
    await queryInterface.addIndex('productdetails', ['productId'], {
      name: 'productdetails_productId_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sales', 'sales_productId_index');
    await queryInterface.removeIndex('products', 'products_productSubCategoryId_index');
    await queryInterface.removeIndex('productsubcategories', 'productsubcategories_productCategoryId_index');
    await queryInterface.removeIndex('productcategories', 'productcategories_categoryId_index');
    await queryInterface.removeIndex('productdetails', 'productdetails_productId_index');
  }
};
