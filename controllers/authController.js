const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const userController = require('./userController');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
module.exports.signup = async (req, res, next) => {

    const user = { fullName: '', email: '', password: '', role: 'SELLER' }
    user.fullName = req.body.fullName;
    user.email = req.body.email;
    user.password = req.body.password;
    try {
        user.password = await bcrypt.hash(user.password, 10);
        const savedUser = await db.User.create(user);
        return res.status(201).json({
            status: "success",
            user: savedUser
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.signin = async (req, res, next) => {
    const email = req.body.email;
    let password = req.body.password;
    let valid;
    const user = await db.User.findOne({ where: { email: email } });
    if (user) {
        valid = await bcrypt.compare(password, user.dataValues.password);

        if (valid) {
            this.createTokenAndSendToken({
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }, res);
        }
        else {
            return next(new AppExceptions('username or password is incorrect', 401));
        }
    }
    else {
        return next(new AppExceptions('User not found', 404));
    }
}
module.exports.jwtSign = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}
module.exports.createTokenAndSendToken = (user, res) => {
    const token = this.jwtSign(user);
    res.status(201).json({
        status: 'success',
        user,
        token
    });
}

module.exports.checkTokenValidityAndUser = async (req, res, next) => {
    let token = req.body.token;
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        if (decoded) {
            let user = await userController.getUserById(decoded.id);
            if (user) {
                if ((new Date(user.passwordChangedAt).getTime()) / 1000 > decoded.iat) {
                    return res.status(401).json({
                        message: "password changed after issuing the token, please login again"
                    })
                }
                user = {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                };

                return res.status(200).json({
                    user
                });
            }
        } else {
            return res.status(401).json({
                message: "invalid token"
            })
        }
    } catch (e) {
        console.log(e);
        return res.status(401).json({
            message: "invalid token"
        })
    }



}