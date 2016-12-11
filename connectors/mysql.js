var mysql = require('mysql');

module.exports = mysql.createConnection({
    host: 'movieroles.ml',
    user: 'root',
    password: 'root',
    database: 'imdb',
    port: 3306,
    multipleStatements: true
});
