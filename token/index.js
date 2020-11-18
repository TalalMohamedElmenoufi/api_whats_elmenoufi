const jwt = require('jsonwebtoken');

exports.obrigatorio = (req, res, next) => {

    try{
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, 'API');
        req.usuario = decode;
        next();
    } catch(error){
        return res.status(401).send({ mensagem:'Falha no token' });
    }
}

exports.opcional = (req, res, next) => {

    try{
        const token = req.headers.authorization.split(' ')[1];
        const decode = jwt.verify(token, 'API');
        req.usuario = decode;
        next();
    } catch(error){
        next();
    }
}