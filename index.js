var express = require('express');
var app = express();
var mysql = require('mysql');
var connection = require('./connectors/mysql.js');
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


function getError(err) {
	var errObj = {};
	errObj['code'] = err.code;
	errObj['desc'] = err.toString();
	errObj['fatal'] = err.fatal;	
	return errObj;
}

connection.connect(function(err) {
	if (err) {
		console.error('Error connecting to mysql db: ' + err.stack);
		return;
	}
	
	console.log('connected as id ' + connection.threadId);
}
	
);



app.get('/', function (req, res) {
    res.send('Hello World!');
});
app.get('/actorByName/:name', function (req, res) {
    var name = req.params.name + '%';
    console.log('name: ', name);
    var inserts = [name];
    var query = 'SELECT * FROM Actors WHERE name LIKE ? LIMIT 10;';
    query = mysql.format(query, inserts);
    console.log(query);
    connection.query(query, function(err, rows, fields) {

        res.setHeader('Content-Type', 'application/json');
	res.setHeader('Access-Control-Allow-Origin', '*');
if (err) {
	    console.log(err);
	    res.send(getError(err));
	}

        else {
            res.send(rows);
        }

        
    });
    
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
	
	var genresQuery = 'SELECT Genres.genre FROM Genres, Of_Genre WHERE Of_Genre.gID = Genres.gID AND Of_Genre.mID = ?;';
	genresQuery = mysql.format(genresQuery, inserts);
    
    connection.query(movieQuery + castQuery + directorsQuery + genresQuery, function(err, rows, fields) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
		if (err) {
			console.log(err);
			res.send(getError(err));
		}
		else {
			var movie = { err: 0 };
			if (rows[0].length == 1) {
				movie = rows[0][0];
				var actors = rows[1];
				var directors = rows[2];
				var genres = rows[3].map(function (genreObj) {
					// Change each element from genre object to just a string
					return genreObj['genre'];
				});
				
				movie['actors'] = actors;
				movie['directors'] = directors;
				movie['genres'] = genres;
			}
			else {
				movie['err'] = -1;
				movie['desc'] = "No movie with that id";	
			}
			res.send(movie);
		}
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
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
		if (err) {
			console.log(err);
			res.send(getError(err));
		}
		else {
			var actor = { err: 0 };
			if (rows[1].length == 1) {
				var movies = rows[0];
				actor = rows[1][0];
				var directors = rows[2];
				
				actor['movies'] = movies;
				actor['directors'] = directors;
			}
			else {
				actor['err'] = -1;
				actor['desc'] = 'No actor with that id';
			}
			res.send(actor);
		}
    });
});


app.get('/query/:genre/:budget/:duration/:gender/:rating', function (req, res) {
    var genre = req.params.genre;
    var budget = parseInt(req.params.budget, 10);
    var duration = parseInt(req.params.duration, 10);
    var gender = parseInt(req.params.gender, 10);
    var rating = parseInt(req.params.gender, 10);
    
    var budgetQuery = "";
    var durationQuery = "";
    var genderQuery = "";
    var ratingQuery = "";
    
    switch(budget) {
    case 1:
        budgetQuery += " AND Movies.budget > 100000000";
        break;
    case 2:
        budgetQuery = " AND Movies.budget > 20000000";
        break;
    case 3:
        budgetQuery = " AND Movies.budget < 10000000";
        break;
    default:
        budgetQuery = "";
    }

    switch(gender) {
    case 1:
        genderQuery += ' AND Actors.gender = "male"';
        break;
    case 2:
        genderQuery += ' AND Actors.gender = "female"';
        break;
    case 3:
    default:
        genderQuery = "";
    }

    switch(duration) {
    case 1:
        durationQuery += " AND Movies.duration < 80";
        break;
    case 2:
        durationQuery += " AND Movies.duration < 100";
        break;
    case 3:
        durationQuery = "";
        break;
    case 4:
        durationQuery = " AND Movies.duration > 120";
        break;
    default:
        durationQuery = "";
        
    }

    switch(rating) {
    case 1:
        ratingQuery = "";
        break;
    case 2:
        ratingQuery = ' AND (Movies.mpaa = "R" OR Movies.mpaa = "NC-17")'
        break;
    case 3:
        ratingQuery = ' AND Movies.mpaa = "PG-13" '
        break;
    case 4:
        ratingQuery = ' AND Movies.mpaa = "PG" '
        break;
    case 5:
        ratingQuery = ' AND Movies.mpaa = "G" ';
        break;
    default:
        ratingQuery = "";
        break;
    }
    
        
    var query = 'SELECT Actors.name, Actors.aID, Cast_In.role, Movies.name AS mname, Movies.mID FROM Actors, Movies, Genres, Cast_In, Of_Genre WHERE Genres.genre = ? AND Genres.gid = Of_Genre.gid AND Of_Genre.mID = Movies.mID AND Cast_In.mID = Movies.mID AND Cast_In.aID = Actors.aID ' + budgetQuery + genderQuery + durationQuery + ratingQuery + ' ORDER BY Actors.num_roles DESC;';
    
    
    var inserts = [genre];

    query = mysql.format(query, inserts);
    console.log(query);
        connection.query(query, function(err, rows, fields) {

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
	if (err) {
	    console.log(err);
	    res.send(getError(err));
	}

        else {
            res.send(rows);
        }

        
    });

    
});


app.get('/actorByGenre/:genre', function(req, res) {
    var genre = req.params.genre;
    var inserts = [genre];

    var query = 'SELECT Actors.name, Actors.aID, Cast_In.role, Movies.name AS mname, Movies.mID FROM Actors, Movies, Genres, Cast_In, Of_Genre WHERE Genres.genre = ? AND Genres.gid = Of_Genre.gid AND Of_Genre.mID = Movies.mID AND Cast_In.mID = Movies.mID AND Cast_In.aID = Actors.aID GROUP BY Movies.mID ORDER BY Movies.gross DESC';



    
    query = mysql.format(query, inserts);

    console.log(query);
    connection.query(query, function(err, rows, fields) {

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
	if (err) {
	    console.log(err);
	    res.send(getError(err));
	}

        else {
            res.send(rows);
        }

        
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
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
		if (err) {
			console.log(err);
			res.send(getError(err));
		}
		else {
			var director = { err: 0 };
			if (rows[2].length == 1) {
				var movies = rows[0];
				var actors = rows[1];
				director = rows[2][0];
				
				director['movies'] = movies;
				director['actors'] = actors;
			}
			else {
				director['err'] = -1;
				director['desc'] = 'No director with that id';	
			}
			res.send(director);
		}
    });
});

app.listen(3001, function () {
    console.log('Movie DB Querier Backend on Port 3001');
});
