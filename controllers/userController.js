const AppExceptions = require('../util/AppExceptions');
const crypto = require('crypto');
const db = require('../models/index');
const filter = require('../util/filter');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../util/email');
const authController = require('./authController');

module.exports.getUserById = async (id) => {
    try {
        const user = await db.User.findOne({ where: { id } });
        return user;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}

module.exports.getUser = async (req, res, next) => {
    const id = req.params.id;
    let users;
    try {
        users = await this.getUserById(id);
        if (!users) {
            next(new AppExceptions('user not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: users
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getUsers = async (req, res, next) => {
    let users;
    const queryString = req.query;
    const apiFilters = new filter(db.User, queryString);
    let filterOptions = {
        role: { [db.Sequelize.Op.ne]: "ADMIN" },
    }
    apiFilters.query.where = { ...apiFilters.query.where, ...filterOptions };
    try {
        let result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        users = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: users,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateUser = async (req, res, next) => {
    const id = req.params.id;
    const oldUser = await this.getUserById(id);
    if (oldUser) {
        if (req.body.email) {
            oldUser.email = req.body.email;
        }
        if (req.body.fullName) {
            oldUser.fullName = req.body.fullName;
        }
        try {
            await oldUser.save();
            res.status(200).json({
                status: "Success",
                message: 'Update Successful'
            })
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
    else {
        next(new AppExceptions('User not found', 404));
    }

}
module.exports.deleteUser = async (req, res, next) => {
    const id = req.params.id;
    const oldUser = await this.getUserById(id);
    if (oldUser) {
        try {
            await oldUser.destroy();
            res.status(204).json({
                status: "Success",
                message: 'delete Successful'
            })
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
    else {
        next(new AppExceptions('User not found', 404));
    }
}
module.exports.createTokenAndSendToken = (user, res) => {
    const token = authController.jwtSign(user);
    res.status(201).json({
        status: 'success',
        token
    });
}
module.exports.createTokenAndSendUserToken = (user, res) => {
    const token = authController.jwtSign(user);
    res.status(201).json({
        status: 'success',
        user,
        token
    });
}
module.exports.forgotPassword = async (req, res, next) => {
    const email = req.body.email;

    try {
        const user = await db.User.findOne({ where: { email: email } });
        if (user) {
            const random = crypto.randomBytes(32).toString('hex');
            const passwordResetToken = crypto.createHash('sha256').update(random).digest('hex');
            const passwordResetExpires = Date.now() + 10 * 60 * 1000;
            user.passwordResetToken = passwordResetToken;
            user.passwordResetTokenExpires = passwordResetExpires;
            await user.save();
            const resetUrl = `${req.protocol}://localhost:5173/resetPassword/${random}`;
            const message = `Email verification step for resetting Password ---> 
            please click on the below link if you forgot your password if you didn't please ignore this`
            const options = {
                email: email,
                subject: "Your password reset Token that is only valid for 10min",
                message: message + " \n " + resetUrl,
            }
            try {
                await sendEmail(options);
                res.status(200).json({
                    status: "success",
                    message: 'Token sent to email'
                })
            } catch (e) {
                return next(new AppExceptions("Can't send Email , Maybe check your internet connection", 400));
            }


        } else {
            console.log(e);
            return next(new AppExceptions("user Not Found", 404));
        }

    } catch (e) {
        console.log(e);
        return next(e);
    }

}
module.exports.resetPassword = async (req, res, next) => {
    const resetToken = req.params.resetToken;
    const token = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await db.User.findOne({
        where: {
            passwordResetToken: token,
            passwordResetTokenExpires: {
                [db.Sequelize.Op.gt]: Date.now()
            }
        }
    });
    if (!user) {
        return next(new AppExceptions('Invalid reset token or the token has expired', 401));
    }
    if (req.body.password == req.body.confirmPassword) {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.password = await bcrypt.hash(req.body.password, 10);
        try {
            await user.save();
            this.createTokenAndSendUserToken({
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }, res
            );
        } catch (e) {
            return next(e);
        }
    } else {
        return next(new AppExceptions('Password and Passwordconfirm are not the same', 400));
    }
}
module.exports.changePassword = async (req, res, next) => {
    let oldPassword;
    let oldPasswordInput = req.body.oldPassword;
    let newPassword;
    let user;
    newPassword = req.body.newPassword;
    user = await this.getUserById(req.params.userId);
    if (!user) {
        return next(new AppExceptions("Unauthorized Access", 403));
    }
    oldPassword = user.password;
    confirmPassword = req.body.confirmPassword;
    if (newPassword == confirmPassword) {
        if (bcrypt.compare(oldPasswordInput, oldPassword)) {
            newPassword = await bcrypt.hash(newPassword, 10);
            user.password = newPassword;
            user.passwordChangedAt = new Date(Date.now());
            try {
                await user.save();
                res.status(201).json({
                    status: 'Success',
                    message: "password Changed successfully"
                })
            } catch (e) {
                next(e);
            }
        } else {
            return next(new AppExceptions("Incorrect old Password", 400))
        }

    } else {
        return next(new AppExceptions('confirm Password and new password don\'t match', 400));
    }

}