module.exports = (req, res, next) => {
    res.sendResponse = (data = null, statusCode = 200) => {
        return res.status(statusCode).json({
            ...data,
            success: true,
        })
    }
    return next();
}