// Boc cac ham async trong route de tu dong bat loi va chuyen cho error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
