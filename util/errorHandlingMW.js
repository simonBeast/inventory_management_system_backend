const AppExceptions = require('./AppExceptions');
const logger = require('../util/winstonConfig');

const handleDuplicateError = (err) => {
    let error_message = err.parent.toString();
    let start_index = error_message.indexOf("Duplicate entry '") + "Duplicate entry '".length;
    let end_index = error_message.indexOf("' for key '");
    let duplicate_value = error_message.substring(start_index, end_index);
    return new AppExceptions(`Duplicate entry {${duplicate_value}} already exists`, 400);
}
const handleBadRequestErrors = (err) => {
    let errors = [];
    let message = '';
    errors = Object.values(err).map(err =>
        err.message
    );
    message = `${errors.join('. ').replace(/"/g, ' ')}`;
    return new AppExceptions(message, 400);
}
const handleForeignKeyError = (err) => {
    let error_message = err.toString();
    let regex = /CONSTRAINT `(.+?)` FOREIGN KEY \(`(.+?)`\) REFERENCES `(.+?)` \(`(.+?)`\)/;
    let matches = error_message.match(regex);
    return new AppExceptions(`${matches[2]} is an incorrect reference`, 500)

}
const handleJsonwebTokenError = (err) => {
    return new AppExceptions('Invalid token! please login to get access.', 401)
}
const sendErrorDev = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        })
    }
    else {
        res.status(500).json({
            status: 'Error',
            message: err
        })
    }
}
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err['message']
        })
    }
    else {
        res.status(500).json({
            status: 'Error',
            message: 'Something went wrong!!' + `{${err}}`

        })
    }

}
module.exports = (err, req, res, next) => {
    console.log(err);
    logger.error(err);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';
    if (process.env.Node_ENV == 'development') {
        sendErrorDev(err, res);
    }
    else if (process.env.NODE_ENV == 'production') {
        let error;
        error = err;
        if (error.parent && typeof error.parent.code === 'string') {
            if (error.parent.code === 'ER_DUP_ENTRY') {
                error = handleDuplicateError(error);
            }
            else if (error.parent.errno === 1452) {
                error = handleForeignKeyError(error);
            }
        }
        else if (error.parent && typeof error.parent.errno === 'number') {
            if (error.parent.errno === 1452) {
                error = handleForeignKeyError(error);
            }
        }
        else if (error.statusCode == 400 && err.error == 'Bad Request') {
            error = handleBadRequestErrors([...error.details.body]);
        }
        else if (error.name == "JsonWebTokenError") {
            error = handleJsonwebTokenError(error);
        }
        sendErrorProd(error, res);
    }
}