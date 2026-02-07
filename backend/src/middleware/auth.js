const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const { auth0Domain, auth0Audience } = require('../config');

const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),
  audience: auth0Audience,
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256'],
});

module.exports = { jwtCheck };