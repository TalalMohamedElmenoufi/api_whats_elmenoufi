const mysql = require('../mysql').pool;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const fs = require('fs');
//const venom = require('venom-bot');
const venom = require('whatsapp_elmenoufi');

module.exports = class Sessions {


    static async start(sessionName) {
        Sessions.sessions = Sessions.sessions || []; //start array
    
        var session = Sessions.getSession(sessionName);
    
        if (session == false) { //create new session
            console.log('session == false: '+sessionName);
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) { //restart session
            console.log('session.state == CLOSED: '+sessionName);
            session.state = "STARTING";
            session.status = 'notLogged';
            session = await Sessions.addSesssion(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED", "UNPAIRED_IDLE"].includes(session.state) || ["isLogged"].includes(session.status)) {
            session = await Sessions.addSesssion(sessionName);
        } else {
            console.log('No start instancia:'+sessionName+' - session.state+:' + session.state);
            session = await Sessions.addSesssion(sessionName); //depois retirar
        }
        return session;
    }//start


    static async addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);
        console.log('Instancia:'+sessionName+' - newSession.state: ' + newSession.state);
    
        //setup session
        newSession.client = Sessions.initSession(sessionName,'PAIRING');
        Sessions.setup(sessionName);
    
        return newSession;
    }//addSession

    static async initSession(sessionName,statusCell) {
        var session = Sessions.getSession(sessionName);

        const client = venom
        .create(
            sessionName,
          (base64Qr, asciiQR, attempt) => {
            //console.log(asciiQR); // Optional to log the QR in the terminal
            //console.log(base64Qr);
            console.log(attempt, ` instancia:`+sessionName+' ST:'+session.state);


            if(attempt<=6){
                statusCell = 'PAIRING';
            }else{
                statusCell = 'OFFLINE';  
            }
            

            mysql.getConnection( ( error, conn ) => {
                if(error) { return console.log(error)  }
                conn.query(
                    `update usuarios set
                    status_whats_desc  = ?,
                    qr_code            = ?
                    where id           = ?`,
                    [
                    statusCell, 
                    base64Qr,
                    sessionName
                    ],
                    (error, resultado, field) => {
                        conn.release();
                        if(error) { return console.log(error) }
                    }
                )
               });


            var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
              response = {};
        
            if (matches.length !== 3) {
              return new Error('Invalid input string');
            }
            response.type = matches[1];
            response.data = new Buffer.from(matches[2], 'base64');
        
            var imageBuffer = response;
        
             require('fs').writeFile(
              'qrcodes/qrcode_'+instance+'.png',
              imageBuffer['data'],
              'binary',
              function (err) {
                if (err != null) {
                  console.log('instancia:'+sessionName+' '+err);
                }
              }
            );
          },
          
          (statusFind) => {
            session.status = statusFind;
            
            console.log("Inicio - session.status: " + session.status);

          },
          //undefined,
          {
            debug: false, 
            logQR: false, 
            autoClose: 60 * 60 * 24 * 2, 
            disableSpins: true 
          }
        )
        .catch((erro) => {
            session.client = false; 
            session.state = "CLOSED";  
            
            console.log('instancia:'+sessionName+' '+erro);
        });

        return client;

    }


    static async setup(sessionName) {
        var session = Sessions.getSession(sessionName);

        console.log('Instancia:'+sessionName+' Entrou no setup - session:'+session.state);

            await session.client.then(client => {

                if(session.state!='CLOSED'){

                    session.state = "CONNECTED"; //para startar foi adaptado 
                    client.onStateChange(state => {
                        session.state = state;
                        console.log('instancia:' +sessionName+ ' No setup - session.state:' + state);

                        mysql.getConnection( ( error, conn ) => {
                            if(error) { return console.log('instancia:'+sessionName+' '+error)  }
                            conn.query(
                                `update usuarios set
                                status_whats_desc  = ?
                                where id           = ?`,
                                [
                                state,
                                sessionName
                                ],
                                (error, resultado, field) => {
                                    conn.release();
                                    if(error) { return console.log('instancia:'+sessionName+' '+error) }
                                }
                            ) 
                          });

                    });
                    client.onMessage((message) => {

                        let id_whats = message.chat.lastReceivedKey.id;
                        let de_quem = message.from ;
                        let para_quem = message.to;
                        let mensagem = message.body;
                    
                        let retorno_log = JSON.stringify(message) ;
                        mysql.getConnection( ( error, conn ) => {
                          if(error) { return console.log(error) }
                          conn.query(
                              'INSERT INTO movimentacao (instancia, id_whats, de_quem, para_quem, mensagem, retorno_log) VALUES (?,?,?,?,?,?)',
                              [sessionName, id_whats, de_quem, para_quem, mensagem, retorno_log],
                              (error, resultado, field) => {
                                  conn.release();
                                  if(error) { return console.log('ERRO:'+error) }
                              }
                          )
                        });

                        if (message.body === 'Oi' || message.body === 'oi' || message.body === 'Olá' ||   message.body === 'Ola' ||  message.body === 'ola') {
                            client.sendText(message.from, 'Olá, em prevê retorarei seu contato! Obrigado.');
                        }
                    });

                    // Ouça ack's
                    // Veja o status da mensagem quando enviada.
                    // Ao receber o objeto de confirmação, "ack" pode retornar: "INACTIVE", "CONTENT_UNUPLOADABLE", "CONTENT_TOO_BIG", "CONTENT_GONE", "EXPIRED", "FAILED", "CLOCK", "SENT", "RECEIVED", "RECEIVED", "READ" or "PLAYED".
                    client.onAck((ack) => {
                        //console.log( `instance:${instance} - ack:` ,ack);
                    
                        let id_whats = ack.id.id;
                        let de_quem = ack.from ;
                        let para_quem = ack.to;
                        let mensagem = ack.body;  
                        let ackRes = ack.ack; 
                    
                        let retorno_log = JSON.stringify(ack) ;
                    
                        mysql.getConnection( ( error, conn ) => {
                            if(error) { return console.log(error) }
                            conn.query(
                                'INSERT INTO movimentacao_ack (instancia, id_whats, de_quem, para_quem, mensagem, ackRes, retorno_log) VALUES (?,?,?,?,?,?,?)',
                                [sessionName, id_whats, de_quem, para_quem, mensagem, ackRes, retorno_log],
                                (error, resultado, field) => {
                                    conn.release();
                                    if(error) { return console.log(error) }
                                }
                            )
                        });
                    
                    });


                }


            });


    }//setup


    static getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions)
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    }//getSession 
    

    static async sendText(sessionName, number, text) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if ( session.state == "CONNECTED") {
                var resultSendText = await session.client.then(async client => {
                    const user = await client.getNumberProfile(number + '@c.us');
                    //console.log(user);
    
                    const messages = await client.getAllUnreadMessages();
                    //console.log(messages);                    
                    //return await client.sendText(number + '@c.us', 'Olá '+ user.id.user + ' '+ text);
                    return await client.sendText(number + '@c.us', text);

                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//message





    static async sendImage(sessionName, number, path, imgname, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultImage = await session.client.then(async client => {
                   // return await client.sendImage(number + '@c.us', path,  imgname, caption);

                    return await client
                    .sendImage(
                      '559291725319@c.us',
                      'https://file-examples-com.github.io/uploads/2017/10/file_example_JPG_100kB.jpg',
                      'image-name',
                      'Caption text'
                  )

                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//Imagem




    static async sendLinkPreview(sessionName, number, link, title) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendLinkPreview = await session.client.then(async client => {
                    //return await client.sendLinkPreview(number + '@c.us', link, title);

                    return await client.sendLinkPreview('559291725319@c.us', 'https://www.elmenoufi.com.br/bot/?u=login&c=9&p=1', 'titulo do link');

                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//link



}