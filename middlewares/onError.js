const sendError = require('../utils/sendError');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    let error = { ...err }
    if (err.name === 'CastError') {
        error = new sendError(`Resource not found, invalid ${err.path}`, 404);
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(value => value.message);
        error = new sendError(message, 400);
    }

    return res.status(err.statusCode).json({
        success: false,
        error,
        message: error.message,
        stack: error.stack

    });



}