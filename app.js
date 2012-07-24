
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

var Receipt = sequelize.define('Receipt', {
    subject : Sequelize.STRING,
    date : Sequelize.DATE,
    team : Sequelize.STRING,
    name : Sequelize.STRING,
    price : Sequelize.INTEGER
});

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

function common_index(req) {
    var subject = req.param('subject', '');
    var team = req.param('team', '');
    var name = req.param('name', '');

    return '/' + '?subject=' + subject + '&team=' + team + '&name=' + name;
}

app.all('/add', function(req, res) {
    var subject = req.param('subject');
    var team = req.param('team');
    var name = req.param('name');

    var receipt = Receipt.build({
        subject : subject,
        date : req.param('date'),
        team : team,
        name : name,
        price : req.param('price')
    });

    receipt.save().success(function() {
        res.redirect(common_index(req));
    }).error(function() {
        res.send('save error');
    })
});

app.post('/delete', function(req, res) {
    var id = parseInt(req.param('id'));
    Receipt.find(id).success(function(r) {
        r.destroy();
        res.redirect(common_index(req));
    })
});

app.get('/', function(req, res) {
    var w = {};
    var count=0;
    var subject = req.param('subject', null);
    var team = req.param('team', null);
    var name = req.param('name', null);

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
        res.render('index.ejs', {
            team: team, subject: subject, name: name,
            receipts: receipts, counts:counts
        } );
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
