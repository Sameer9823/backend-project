const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next); // Await the requestHandler to catch any errors
        } catch (err) {
            next(err); // Pass the error to the next middleware
        }
    };
};

export { asyncHandler };
