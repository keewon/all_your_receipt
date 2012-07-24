
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , Sequelize = require("sequelize");

var sequelize = new Sequelize('database', 'root', '', {
    dialect: 'sqlite',
    storage: __dirname + '/data.sqlite'
});

var Recipe = sequelize.define('Recipe', {
    team : Sequelize.STRING,
    subject : Sequelize.STRING
});

var Receipt = sequelize.define('Receipt', {
    subject : Sequelize.STRING,
    date : Sequelize.DATE,
    team : Sequelize.STRING,
    name : Sequelize.STRING,
    price : Sequelize.INTEGER
});

Recipe.sync();
Receipt.sync();

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function recipe_index(req) {
    var subject = req.param('subject', '');
    var team = req.param('team', '');
    var name = req.param('name', '');

    return '/';
}

function receipt_index(req) {
    var subject = req.param('subject', '');
    var team = req.param('team', '');
    var name = req.param('name', '');

    return '/recipe/' + encodeURI(team) + '/' + encodeURI(subject) + '?name=' + encodeURI(name);
}

app.all('/recipe/add', function(req, res) {
    var subject = req.param('subject');
    var team = req.param('team');

    var recipe = Recipe.build({
        subject : subject,
        team : team
    });

    recipe.save().success(function() {
        res.redirect(recipe_index(req));
    }).error(function() {
        res.send('save error');
    })
});

app.all('/receipt/add', function(req, res) {
    var subject = req.param('subject');
    var team = req.param('team');
    var name = req.param('name');

    var receipt = Receipt.build({
        subject : subject,
        date : new Date(req.param('date')),
        team : team,
        name : name,
        price : req.param('price')
    });

    receipt.save().success(function() {
        res.redirect(receipt_index(req));
    }).error(function() {
        res.send('save error');
    })
});

app.post('/receipt/delete', function(req, res) {
    var id = parseInt(req.param('id'));
    Receipt.find(id).success(function(r) {
        r.destroy();
        res.redirect(receipt_index(req));
    })
});

app.get('/receipt/print/:page', function(req, res) {
    var subject = req.param('subject');
    var team = req.param('team');
    var name = req.param('name');
    var page = req.param('page', 1);

    var query1 = {
        where: {
            subject: subject,
            team: team,
            name: name
        },
        order: 'date ASC',
        offset: (page-1) * 6,
        limit: 6
    };

    Receipt.findAll(query1).success(function(receipts) {

        res.render('print.ejs', {
            team: team, subject: subject, name:name,
            receipts: receipts
        });
    })
    
});

app.get('/recipe/:team/:subject', function(req, res) {
    var w = {};
    var count=0;
    var subject = req.param('subject', null);
    var team = req.param('team', null);
    var name = req.param('name', "");

    if (subject && subject.length > 0) {
        w.subject = subject;
        ++count;
    }

    var query1 = { order: 'updatedAt DESC' };
    if (count > 0)
        query1.where = w;

    Receipt.findAll(query1).success(function(receipts) {
        var counts = {};
        for (var i=0; i<receipts.length; ++i) {
            n = receipts[i].name;
            if (isNaN(counts[n]))
                counts[n] = 1;
            else
                counts[n]++;
        }
        console.log(counts);
        res.render('recipe.ejs', {
            team: team, subject: subject, name: name,
            receipts: receipts, counts:counts
        });
    });
});

app.get('/', function(req, res) {
    Recipe.findAll({ order: 'updatedAt DESC'}).success(function(recipes) {
        console.log(recipes);
        res.render('index.ejs', {
            recipes: recipes
        });
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
