const jwt = require('jsonwebtoken');

const TOKEN_SECRET = 'hubizict';

const tokenGenerator = (data, callback) => {
  let token = jwt.sign(data, TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: '8h'
  });
  callback(token)
}

const isValid = (token, callback) => {
  jwt.verify(token, TOKEN_SECRET, (err, decode) => {
    if (err) {
      // console.log("=========Token Helper: Can't decode token")
      callback({isValid: false})
    } else {
      const exp = new Date(decode.exp * 1000)
      const now = Date.now()
      const day = (60 * 60 * 24 * 1000)
      if (exp < now) {
        // console.log("=========Token Helper: Expired Token")
        callback({isValid: false})
      } else if (exp < now + (5 * day)) {
        // console.log("=========Token Helper: Generate New Token")
        const newToken = module.exports.generateToken(decode.user.id)
        callback({isValid: true, token: newToken, userInfo:decode})
      } else {
        // console.log("=========Token Helper: Token is valid")
        callback({isValid: true, token: token, userInfo:decode})

      }
    }
  });
}

const tokenHandler = (req, res, next) => {
  const { token } = req.query

  if(token) {
    module.exports.isValid(token, (result) => {
      req.userInfo = result;
      next()
    })
  } else {
    req.userInfo = {isValid: false}
    next()
  }
}

const tokenDestroy = (req, res, next) => {
  res.clearCookie('userInfo');
  next();
}

const getDecoded = (token, callback) => {
  jwt.verify(token, TOKEN_SECRET, (err, decode) => {
    if(token == undefined) { callback(undefined); return; }

    if(err) {
      callback(undefined);
      return;
    }

    callback(decode);

  });
}

const decodedNext = async (req, res, next) => {
  
  let token = req.cookies.userInfo;

  await jwt.verify(token, TOKEN_SECRET, (err, decode) => {
    if(token == undefined || err) { return next(); }

    req.body.token = decode;
    next();

  });
}

/**
 * token 값을 체크 하여 값이 없거나 잘못 되었다면 로그인 화면으로 보낸다.
 * @param {*} req 
 * @param {*} res 
 */
const tokenCheckWithoutPage = (req, res, next) => {

  let token = req.cookies.userInfo;
  jwt.verify(token, TOKEN_SECRET, (err, decode) => {
    // 토큰이 expires 된경우 메인화면으로 이동
    if(token == undefined || err) { 
      // 로그인 화면으로 보낸다.
      res.redirect('/auth/login');
      return; 
    }

    next();
  });
}

module.exports = {
  tokenGenerator,
  isValid,
  getDecoded,
  decodedNext,
  tokenDestroy,
  tokenHandler,
  tokenCheckWithoutPage
}