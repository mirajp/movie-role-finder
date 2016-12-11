var express = require('express');
var app = express();
var mysql = require('mysql');
var connection = require('./connectors/mysql.js');

connection.connect();

app.get('/', function (req, res) {
    res.send('Hello World!');
});


app.get('/movie/:id', function (req, res) {
    var movieID = parseInt(req.params.id, 10);
    
    var inserts = [movieID];
    var movieQuery = 'SELECT * FROM Movies WHERE mID = ?;';
    movieQuery = mysql.format(movieQuery, inserts);
    
    var castQuery = 'SELECT Actors.*, Cast_In.role FROM Actors, Cast_In WHERE Actors.aID = Cast_In.aID AND Cast_In.mID = ?;';
    castQuery = mysql.format(castQuery, inserts);

    var directorsQuery = 'SELECT Directors.* FROM Directors, Directed_By WHERE Directors.dID = Directed_By.dID AND Directed_By.mID = ?;';
    directorsQuery = mysql.format(directorsQuery, inserts);
    
    connection.query(movieQuery + castQuery + directorsQuery, function(err, rows, fields) {
        if (err) throw err;
        
        var movie = rows[0][0];
        var actors = rows[1];
        var directors = rows[2];
        
        movie['actors'] = actors;
        movie['directors'] = directors;

        res.setHeader('Content-Type', 'application/json');
        res.send(movie);
    });
});

app.get('/actor/:id', function (req, res) {
    var actorID = parseInt(req.params.id, 10);
    
    var inserts = [actorID];
    var moviesQuery = 'SELECT DISTINCT Movies.*, Cast_In.role FROM Movies, Cast_In WHERE Cast_In.mID = Movies.mID AND Cast_In.aID = ?;';
    moviesQuery = mysql.format(moviesQuery, inserts);
    
    var actorQuery = 'SELECT Actors.* FROM Actors WHERE Actors.aID = ?;';
    actorQuery = mysql.format(actorQuery, inserts);

    var directorsQuery = 'SELECT DISTINCT Directors.* FROM Directors, Directed_By, Cast_In WHERE Directors.dID = Directed_By.dID AND Directed_By.mID = Cast_In.mID AND Cast_In.aID = ?;';
    directorsQuery = mysql.format(directorsQuery, inserts);
    
    connection.query(moviesQuery + actorQuery + directorsQuery, function(err, rows, fields) {
        if (err) throw err;
        
        var movies = rows[0];
        var actor = rows[1][0];
        var directors = rows[2];
        
        actor['movies'] = movies;
        actor['directors'] = directors;

        res.setHeader('Content-Type', 'application/json');
        res.send(actor);
    });
});

app.get('/director/:id', function (req, res) {
    var directorID = parseInt(req.params.id, 10);
    
    var inserts = [directorID];
    var moviesQuery = 'SELECT DISTINCT Movies.* FROM Movies, Directed_By WHERE Directed_By.mID = Movies.mID AND Directed_By.dID = ?;';
    moviesQuery = mysql.format(moviesQuery, inserts);
    
    var actorsQuery = 'SELECT DISTINCT Actors.* FROM Actors, Cast_In, Movies, Directed_By WHERE Actors.aID = Cast_In.aID AND Movies.mID = Cast_In.mID AND Movies.mID = Directed_By.mID AND Directed_By.dID = ?;';
    actorsQuery = mysql.format(actorsQuery, inserts);

    var directorQuery = 'SELECT DISTINCT Directors.* FROM Directors WHERE Directors.dID = ?;';
    directorQuery = mysql.format(directorQuery, inserts);
    
    connection.query(moviesQuery + actorsQuery + directorQuery, function(err, rows, fields) {
        if (err) throw err;
        
        var movies = rows[0];
        var actors = rows[1];
        var director = rows[2][0];
        
        director['movies'] = movies;
        director['actors'] = actors;

        res.setHeader('Content-Type', 'application/json');
        res.send(director);
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
