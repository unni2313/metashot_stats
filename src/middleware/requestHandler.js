const requestHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .then((result) => {
                if (!result) return;
                const { statusCode = 200, message = 'Success', data } = result;
                res.status(statusCode).json({
                    status: 'success',
                    message,
                    data
                });
            })
            .catch(next);
    };
};

module.exports = requestHandler;
