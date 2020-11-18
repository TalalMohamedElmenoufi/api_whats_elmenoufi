const mysql = require('mysql');

var pool = mysql.createPool({
    "user" : "root",
    "password" : "",
    "database" : "api_whatsapp",
    "host" : "localhost",
    "port" : 3306
});

exports.pool = pool;