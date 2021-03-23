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



var http = require('http');
var WebSocket = require('ws');
var atob = require('atob');
var Blob = require('cross-blob');
var FileReader = require('FileReader');
var querystring = require('querystring');
//const httpServer = http.createServer(app);
//var https = require('https').createServer({});

const mongoose = require('mongoose')
const schema = require('./mongoImage.js')

const Image = mongoose.model('Image', schema.imageSchema);

var sanitizeHtml = require('sanitize-html');
var template = require('./module/template.js');
const { response } = require('express');

const PORT = process.env.PORT || 3000;
let httpServer= app.listen(PORT, () => console.log(`HTTP server listening at http://localhost:${PORT}`));
const wsServer = new WebSocket.Server({ server: httpServer });

// array of connected websocket clients
let connectedClients = [];
var snapshotHour = -1;	// start auto-capping the history feed. 
var imageName = "image.jpg";




    
wsServer.on('connection',  (ws, req) => {
    console.log('Connected');
   
    //console.log(req.file);
    // add new connected client

    connectedClients.push(ws);

    // listen for messages from the streamer, the clients will not send anything so we don't need to filter
    ws.send("난 app.js다");
    
    
    ws.on('message',  async function(message) {
        
        //console.log(message)
        //console.log("/////////////////////////")

        if (ws.readyState === ws.OPEN) { // check if it is still connected
            ws.send("연결됐다1");
            
            
            var BASE64_MARKER = ';base64,';
            var base64Index = message.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            var base64 = message.substring(base64Index);
            var buffer= new Buffer.from(base64, 'base64'); // atob(base64) in window scope

            fs.writeFileSync(imageName,buffer, function(e) {
                if(e) {
                    //sys.debug(e);
                } else {
                    //sys.debug("file written, starting upload...");
                    console.log("convertDataURIToBinary(message)")
                }
            });
            const filePath = __dirname + '\\image.jpg';
            var newFile = fs.createReadStream(filePath);
            
            //console.log(newFile)
            // personally I'd function out the inner body here and just call 
            // to the function and pass in the newFile
            const formData = new FormData();
            formData.append('image', newFile,newFile.name);
            ws.send("연결됐다2");
            
            try{
                var test_result =  await axios.post('http://localhost:3000/test', formData, {
                    // You need to use `getHeaders()` in Node.js because Axios doesn't
                    // automatically set the multipart form boundary in Node.
                    headers: formData.getHeaders()
                    
                });
                ws.send("이미지 test로 전송했다");
                    
                //res.end();  //클라이언트에게 응답을 전송한다
                

                console.log("hhhhhhhhhhhhhhhhhhhh")
                console.log("post image to test")
                console.log(test_result)
                console.log(test_result.status)
                console.log(test_result.data)
                ws.send(JSON.stringify(test_result.data));
                if(test_result.status == 200){
                    test_result_responsedata = test_result.data
                    console.log("ssssssssssss")
                    console.log(test_result_responsedata)
                    
                }
                

               
            }catch(e){console.log("[ERROR|success pass test error] : ",e)}

            
                ws.send("하나 싸이클 돌았다");
            
                //ws.send(data); // send
        } else { // if it's not connected remove from the array of connected ws
        connectedClients.splice(i, 1);
        } 
        
    });
});


// HTTP stuff
app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './views/client.html')));
app.get('/user_main', (req, res) => res.sendFile(path.resolve(__dirname, './views/user_main.html')));


db_config.connect(conn);

app.set('views',  './views');
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.get('/', function (req, res) {
    res.send('ROOT');
});

//로그인 페이지 (앱을 키면 가장 먼저 보이는 화면)
//로그인 GET
app.get('/main', function (req, res) {
  
   res.render('main.html');

});


//로그인 POST
app.post('/main', function (req, res) {
  
    //사용자가 입력한 아이디, 비번 일치하는지 찾는 코드

    //if 비번 = 사용자 입력비번
    //쿠키 설정 https://victorydntmd.tistory.com/35
    //  res.redirect("/user_main")

    //else 비번 != 입력비번
    //  res.redirect("/main")
    
    
});



//회원가입페이지
//register GET
app.get('/register', function (req, res) {
    
    res.render('register.html');

});//register 잘 열리나 테스트용 (나중에 main의 버튼과 연결하기)

 
//register POST
//사용자가 회원가입 버튼을 눌렀을 때 실행되어 db에 정보 저장
app.post('/registerAf', function (req, res) {
   try{
    var body = req.body;
    console.log(body);
    
    //암호화 복호화 set
    var key = 'mykey';
    var cipher = crypto.createCipher('aes192',key);
    var decipher = crypto.createDecipher('aes192',key);

    //암호화(utf8을 base64로 암호화 시킴)
    cipher.update(body.pswd1,'utf8','base64');
    var cipheredOutput = cipher.final('base64');

    //공백란 찾기
    if(blackSearch(body.pswd1,body.name,body.yy,body.mm,body.dd)){
        console.log("공백");
        res.send("공백");
    }

    else{
        conn.query("SELECT * FROM userinfo WHERE ID=?",[body.id] , function(err,data){

            if(data.length==0 && body.pswd1 == body.pswd2){//해당 ID가 없고 비번이 확인이 일치할 때 db에 넣는다. (중복확인)
                var sql = 'INSERT INTO userinfo VALUES(?, ? ,?, ?,?,?,?)';
                var params = [body.id, body.pswd1, body.name,body.gender,body.yy,body.mm,body.dd];
                console.log(sql);
                conn.query(sql, params, function(err) {
                    if(err) {
                        console.log('query is not excuted. insert fail...\n' + err);
                        return;
                    }
                    else res.redirect('/main');
                });
            }


        });

        decipher.update(cipheredOutput,'base64','utf8');
        var decipheredOuput=decipher.final('utf8');

        console.log('원문 : '+pswd1);//원본
        console.log('암호화 : '+cipheredOutput);//암호화
        console.log('복호화 : '+decipheredOuput);//복호화
    }
   }catch(err){
       console.log(err);
   }

    
    
});





//로그인 성공시 사용자에게 보여지는 주요 페이지 (제일 중요한 서비스 구동하는 html, 여기서 웹캠이 구동되고 서버로 전달됨)
app.get('/user_main', function (req, res) {
    
    res.render('user_main.html');
    var postureresult=[]

});

// app.post('/user_main', function (req, res) {
//     console.log("aaaaaaaaaaa")
//     res.json({data : req.body})
// });





//알람을 몇 시간 주기로 할 건지 설정하는 화면
app.get('/alarm_settings', function (req, res) {
   
    res.render('alarm_settings.html');

});

//누적 바른자세시간 보여주는 페이지
app.get('/callender', function (req, res) {
   
    res.render('callender.html');

});

//알람 끄고 키는 설정 화면
app.get('/onoff_settings', function (req, res) {
    
    res.render('onoff_settings.html');

});

app.get('/alarm',function (req,res){
    res.render('alarm.html');
});





/////////////////////////서버간 연결//////////////////////////

//이미지를 nodejs 서버에서 colab 서버로 넘기는 코드
app.get('/upload', function (req, res) {
    
    res.render('upload.html');

 });

 
app.post('/test', multerOption.single('image'),  async (req, res) => {
    //console.log(req.file); 
    fileName = req.file['filename']
    console.log('////////////////////////////')
    hash = md5File.sync('userUpload/'+fileName)
    //console.log(fileName)
     
    
    try{
      var axiosResponse = await axiosRequest('userUpload/'+fileName)
      //console.log("[axiosResponse] : ", axiosResponse)
      if(axiosResponse.status == 200){
        responseData = axiosResponse.data
        //var flaskdata = responseData["text"]
        var flaskdata={
            hash : hash,
            text: responseData["text"]
        }
        Image.create(flaskdata)
        res.json(flaskdata)
            
        
        
    }else{
    res.json({
        hash:          hash     
        })  
    }
    }catch(e){console.log("[ERROR|axiosResponse] : ",e)}
    console.log(flaskdata)
    console.log("success flaskdata imageeeeeee")

});


//샘플 코드
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

//app.listen(3000, () => console.log('Server is running on port 3000...'));
