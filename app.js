const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

const rotaUsuarios = require('./routes/usuarios');

app.use(morgan('dev')); //para auxiliar no desenvolvimento log no nodemon

app.use( bodyParser.urlencoded({ extended:false }) );
app.use( bodyParser.json() );

app.use((req, res, next) => {
    res.header('Access-Control-Origin', '*');
    res.header(
        'Access-Control-Header', 
        'Origin, X-Requrested-With, Accept, Authorization'
    );
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).send({});
    }

    next();
});

app.use('/', rotaUsuarios);

app.use((req, res, next) =>{

    const erro = new Error('Rota não encontrada');
    erro.status = 404 ;
    next(erro);

});

app.use(( error, req, res, next) => {

    res.status(error.status || 500);
    return res.send({
        erro:{
            mensagem: error.message
        }
    });
    
});

module.exports = app;