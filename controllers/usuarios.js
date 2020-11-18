
const jwt = require('jsonwebtoken');

const Sessions = require("../routes/sessions");


exports.getToken = (req, res, next) => {

  const token = jwt.sign({
      instance: req.body.instance
  },
  'API',
  {
      expiresIn:"365d"
  });
  return res.status(200).send({ 
      codigo : 201,
      mensagem: 'Token gerado com sucesso!',
      accessToken: token
   });

};


exports.getOnzap = async (req, res, next) => {

  instance = req.usuario.instance; //resgata o id /tokem/index.js
 
  console.log("starting..." + instance);
  var session = await Sessions.start(instance);
  
  if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
      res.status(200).json({ result: 'success', message: session.state });
  } else {
      res.status(200).json({ result: 'error', message: session.state });
  }


}


exports.postText = async (req, res, next) => {

    sessionName = req.usuario.instance; //resgata o id /tokem/index.js

    //var session = await Sessions.start(sessionName);
  
    //if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
       
        var result = await Sessions.sendText(
            sessionName,
            req.body.numbers,
            req.body.mensagem
            );
            //console.log(req.body);
            res.json(result);         

    //} else {
        //res.status(200).json({ result: 'error', message: session.state });
   // }


}


exports.postImagem = async (req, res, next) => {

    sessionName = req.usuario.instance; //resgata o id /tokem/index.js

    var result = await Sessions.sendImage(
        sessionName,
        req.query.number,
        req.query.path,
        req.query.imgname,
        req.query.caption
        );
        res.json(result);

}

exports.postLink = async (req, res, next) => {

    sessionName = req.usuario.instance; //resgata o id /tokem/index.js

    var result = await Sessions.sendLinkPreview(
        sessionName,
        req.query.number,
        req.query.link,
        req.query.title
        );
        res.json(result);   

}