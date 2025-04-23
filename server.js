const db = require('./models/index');
const app = require('./app');
const dotenv = require('dotenv');
//const {cron} = require('./util/node-cron');
const winston = require('./util/winstonConfig')
dotenv.config({ path: './var.env' });

(async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.sync();
        console.log("db successfully connected");

    } catch (e) {
        console.log(e);
    }

    app.listen(process.env.PORT, '0.0.0.0', () => {
        console.log("server listening on port " + process.env.PORT);
    })
}
)();



