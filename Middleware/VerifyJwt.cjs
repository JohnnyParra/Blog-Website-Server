const jwt = require("jsonwebtoken");

async function verifyJwt(req, res, next) {
  try {
    if (!req.headers.authorization) {
      return res.json('Invalid authorization, no authorization headers');
    }

    const [scheme, token] = req.headers.authorization.split(' ');
    if (scheme !== 'Bearer') {
      return res.json('Invalid authorization, invalid authorization scheme');
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);
    req.user = payload;
  } catch (err) {
    console.error(err);
    if (
      err.message && 
      (err.message.toUpperCase() === 'INVALID TOKEN' || 
      err.message.toUpperCase() === 'JWT EXPIRED' ||
      err.message.toUpperCase() === 'JWT MALFORMED')
    ) {

      req.status = err.status || 500;
      req.body = err.message;
      req.app.emit('jwt-error', err, req);
    } else {
      throw((err.status || 500), err.message);
    }
  }

  next();
};

module.exports = verifyJwt;