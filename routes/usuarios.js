const express = require('express');
const router = express.Router();

const usuarios = require('../controllers/usuarios');
const token = require('../token/index');

router.post('/getToken', usuarios.getToken );

router.get('/onzap', token.obrigatorio, usuarios.getOnzap );

router.post('/send/text', token.obrigatorio, usuarios.postText );

router.post('/send/image', token.obrigatorio, usuarios.postImagem );

router.post('/send/link', token.obrigatorio, usuarios.postLink );

module.exports = router;