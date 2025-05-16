const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const AppExceptions = require('./AppExceptions');
const userController = require('../controllers/userController');
module.exports.guard = async function (req, res, next) {
    let token;
    let decoded;
    let bearerToken = req.headers.authorization
    if (bearerToken && bearerToken.startsWith("Bearer")) {
        try {
            token = bearerToken.split(" ")[1];
            decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        } catch (e) {
            next(e)
        }
        if (decoded) {
            const user = await userController.getUserById(decoded.id);
            if (user) {
                if ((new Date(user.passwordChangedAt).getTime())/1000 > decoded.iat) {
                    return next(new AppExceptions("password changed after issuing the token, please login again"
                    , 401));
                }
                req.user = {
                    id:user.id,
                    email:user.email,
                    fullName:user.fullName,
                    role:user.role
                };
                return next();
            }
        }

    }
   return next(new AppExceptions("not authenticated! Please login to get access", 401))
}
module.exports.restrictAccess = (...roles) => {
    return (req, res, next) => {
        console.log("checkout this property");
        console.log("Request URL:", req.originalUrl);
        console.log("HTTP Method:", req.method);
        if(req.hasOwnProperty('user') && req.user.hasOwnProperty('role')){
            if (roles.includes(req.user.role)) {
                return next();
            }
        }
        return next(new AppExceptions('Unauthorized Access', 403));
    }
}