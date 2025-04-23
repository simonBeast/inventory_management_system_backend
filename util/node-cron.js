const cron = require('node-cron');
const db = require('../models/index');
const { sendLowStockMail } = require('./email')

async function checkForLowStock(){
    try {
        const lowStockProducts = await db.Product.findAll({
            include: [{
              model: db.ProductDetails,
              where: db.Sequelize.where(db.Sequelize.col('ProductDetail.availableQuantity'), '<=', db.Sequelize.col('ProductDetail.minimumStockLevel'))
            }]
          });
          if(lowStockProducts){
            await sendLowStockMail(lowStockProducts);
          }
        } catch (error) {
          console.error('Error checking stock levels:', error);
        }
}


cron.schedule('30 10 * * *', async () => {
    await checkForLowStock();
});

module.exports.cron = cron;