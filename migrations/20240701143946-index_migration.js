'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addIndex('categories',['createdAt'],{
    name:'categories_createdAt_index'
   }),
   await queryInterface.addIndex('categories',['name'],{
    name:'categories_name_index'
   }),
   await queryInterface.addIndex('productcategories',['createdAt'],{
    name:'productcategories_createdAt_index'
   }),
   await queryInterface.addIndex('productcategories',['name'],{
    name:'productcategories_name_index'
   }),
   await queryInterface.addIndex('productdetails',['createdAt'],{
    name:'productdetails_createdAt_index'
   }),
   await queryInterface.addIndex('products',['productName'],{
    name:'products_productName_index'
   }),
   await queryInterface.addIndex('products',['createdAt'],{
    name:'products_createdAt_index'
   }),
   await queryInterface.addIndex('productsubcategories',['createdAt'],{
    name:'productsubcategories_createdAt_index'
   }),
   await queryInterface.addIndex('productsubcategories',['name'],{
    name:'productsubcategories_name_index'
   }),
   await queryInterface.addIndex('returns',['createdAt'],{
    name:'returns_createdAt_index'
   }),
   await queryInterface.addIndex('sales',['createdAt'],{
    name:'sales_createdAt_index'
   }),
   await queryInterface.addIndex('transactionhistories',['createdAt'],{
    name:'transactionhistories_createdAt_index'
   }),
   await queryInterface.addIndex('users',['createdAt'],{
    name:'users_createdAt_index'
   }),await queryInterface.addIndex('users',['email'],{
    name:'users_email_index'
   })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('categories','categories_createdAt_index'),
    await queryInterface.removeIndex('categories','categories_name_index'),
    await queryInterface.removeIndex('productcategories','productcategories_createdAt_index'),
    await queryInterface.removeIndex('productcategories','productcategories_name_index'),
    await queryInterface.removeIndex('productdetails','productdetails_createdAt_index'),
    await queryInterface.removeIndex('products','products_productName_index'),
    await queryInterface.removeIndex('products','products_createdAt_index'),
    await queryInterface.removeIndex('productsubcategories','productsubcategories_createdAt_index'),
    await queryInterface.removeIndex('productsubcategories','productsubcategories_name_index'),
    await queryInterface.removeIndex('returns','returns_createdAt_index'),
    await queryInterface.removeIndex('transactionhistories','transactionhistories_createdAt_index'),
    await queryInterface.removeIndex('users','users_createdAt_index'),
    await queryInterface.removeIndex('users','users_email_index')

  }
};
