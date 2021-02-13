var express = require('express');
var app = express();
var db_config = require( './config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');

db_config.connect(conn);

app.set('views',  './views');
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.get('/', function (req, res) {
    res.send('ROOT');
});

app.get('/main', function (req, res) {
   //var sql = 'SELECT * FROM BOARD';    
   // conn.query(sql, function (err, rows, fields) {
   //     if(err) console.log('query is not excuted. select fail...\n' + err);
   //     else res.render('main.html', {list : rows});
   // });
   res.render('main.html');
});

app.get('/register', function (req, res) {
    //var sql = 'SELECT * FROM BOARD';    
    // conn.query(sql, function (err, rows, fields) {
    //     if(err) console.log('query is not excuted. select fail...\n' + err);
    //     else res.render('main.html', {list : rows});
    // });
    res.render('register.html');
 });//register 잘 열리나 테스트용 (나중에 main의 버튼과 연결하기)


 //Date(body.yy, body.mm, body.dd)
app.post('/registerAf', function (req, res) {
    var body = req.body;
    console.log(body);
   
    var sql = 'INSERT INTO userinfo VALUES(?, ? ,?, ?,?,?,?)';
    var params = [ body.pswd1, body.name,body.gender, body.id,body.yy,body.mm,body.dd];
    console.log(sql);
    conn.query(sql, params, function(err) {
        if(err) {
            console.log('query is not excuted. insert fail...\n' + err);
            return;
        }
        else res.redirect('/main');
    });
    
});

app.get('/write', function (req, res) {
    res.render('write.ejs');
});

app.post('/writeAf', function (req, res) {
    var body = req.body;
    console.log(body);

    var sql = 'INSERT INTO BOARD VALUES(?, ?, ?, NOW())';
    var params = [body.id, body.title, body.content];
    console.log(sql);
    conn.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/list');
    });
});

app.listen(3000, () => console.log('Server is running on port 3000...'));
