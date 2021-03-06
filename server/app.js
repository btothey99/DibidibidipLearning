var express = require('express');
var app = express();
var db_config = require( './config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');

////////////

var fs = require('fs');
var path = require('path');
var axios = require('axios')
var FormData = require('form-data');
var md5File = require('md5-file');

var url = require('url');
var axiosRequest = require('./module/axiosRequest.js');
var multerOption = require('./module/multerOption.js');
//const multer = require('multer');
// 기타 express 코드
//const upload = multer({ dest: 'upload/', limits: { fileSize: 5 * 1024 * 1024 } });


app.post('/test', multerOption.single('image'),  async (req, res) => {
  console.log(req.file); 
  fileName = req.file['filename']
  console.log('////////////////////////////')
  hash = md5File.sync('userUpload/'+fileName)
  console.log(fileName)
   

  try{
    var axiosResponse = await axiosRequest('userUpload/'+fileName)
    console.log("[axiosResponse] : ", axiosResponse)
    if(axiosResponse.status == 200){
        console.log("success imageeeeeee")
    }
    else{
      response.json({
        hash:          hash     
      })
    }
  }catch(e){console.log("[ERROR|axiosResponse] : ",e)}
});


//var key = fs.readFileSync(path.join(__dirname,'./keys/p'));
//var cert =fs.readFileSync(path.join(__dirname
//var http = require('http').Server(app);
//var https = require('https').createServer({});

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
/*
app.post('/imageUpload',  multerOption.single('image'), async (req, res) => {
    fileName = requset.file['filename']
    console.log(fileName)
    hash = md5File.sync('userUpload/'+fileName)


    var axiosResponse = await axiosRequest('hello~~')
    console.log("[axiosResponse] : ", axiosResponse)
    res.render('axiosRequest.html');
 });//register 잘 열리나 테스트용 (나중에 main의 버튼과 연결하기)
*/


app.get('/upload', function (req, res) {
    
    res.render('upload.html');

 });

/*
app.get('/text_test', function (req, res) {
    const formData = new FormData();
    formData.append("text","wowwww","textname");
    axios.create({headers: formData.getHeaders()}).post("http://...", formData)
    console.log(formData)
    res.render('axiosRequest.html');
});
*/
/*
app.post('/test', async (req, res)=> { //폼데이터의 속성명이 image이거나 폼 태그 인풋의 name이 image인 파일 하나를 받겠다는 뜻입니다.
   
    //console.log(req)
    console.log(multerOption.single('image'))
    console.log('///////////////////////')
    console.log(req.file)
    console.log('****************')
    fileName = req.file['filename']
    console.log(fileName)
    hash = md5File.sync('userUpload/'+fileName)

    try{
        var axiosResponse = await axiosRequest('userUpload/'+fileName) //'userUpload/'+fileName를 인자로 axiosRequest 호출
                                                                       // axiosRequest() 는 받은 인자의 file경로 읽어서 이미지를 flask서버로 넘겨주는 역할
        console.log("[axiosResponse] : ", axiosResponse)
    }catch(e){
        {console.log("[ERROR|axiosResponse] : ",e)}
    }
    filePath = 'userUpload/'+fileName
/////////////////////////////////////////////////
    var newFile = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append("image",newFile,newFile.name);
    var response ;
    try{
        response = await axios.create({headers: formData.getHeaders()}).post("http://..., formData)
        console.log(formData)
        
    }catch(e){
        console.log("ERROR|axiosRequest",e)
        response = e
    }
/////////////////////////////////////////////////
    var axiosResponse = response;
    res.render('axiosRequest.html');
});
*/
/*
var upload = multer({ dest : 'userUpload/' });  
app.get('/upload', function (req, res) {
    
   });
 
app.post('/upload', upload.any(), function(req, res, next) {

    var path ='./userUpload/' ;

    var realpath = path + req.files[0].originalname;

    var rename1 = 'userUpload/' + req.files[0].filename;

    var rename2 = 'userUpload/'+ req.files[0].originalname;


    fs.rename(rename1, rename2, function(err) {

          if(err){

                console.log(err);

          }

          else{

                console.log('rename success');

                fs.readFile('userUpload/'+req.files[0].originalname, function(err, data){

                   var tmp = new Buffer(data).toString('base64');

                   var purl = '/userUpload/'+req.files[0].originalname;

                  
       // image가 저장된 url을 ‘image’이벤트 발생시키면서 넘긴다

          });

         
          }

    });

    


   

});


 */
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
