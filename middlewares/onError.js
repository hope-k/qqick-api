const sendError = require('../utils/sendError');

module.exports = (err, req, res, next) => {
    let error;
    err.statusCode = err.statusCode || 500;
    if (err.name === 'CastError') {
        error = new sendError(`Resource not found, invalid ${err.path}`, 404);
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(value => value.message);
        error = new sendError(message, 400);
    }
    const message = err.message?.split(',')

    return res.status(err.statusCode).json({
        success: false,
        error: message,
        stack: err.stack

    });



}