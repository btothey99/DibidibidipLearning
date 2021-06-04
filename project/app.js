var express = require('express');
var app = express();
var db_config = require( './config/database.js');
var conn = db_config.init();
var bodyParser = require('body-parser');


var fs = require('fs');
var path = require('path');
var axios = require('axios')
var FormData = require('form-data');
var md5File = require('md5-file');

var url = require('url');
var axiosRequest = require('./module/axiosRequest.js');
var preaxiosRequest = require('./module/preaxiosRequest.js');




var http = require('http');
var https = require('https');
var WebSocket = require('ws');
var atob = require('atob');
var Blob = require('cross-blob');
var FileReader = require('FileReader');
var querystring = require('querystring');
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var crypto = require('crypto');
var dbOptions = db_config;
var cookieParser=require('cookie-parser');



const mongoose = require('mongoose')
const schema = require('./mongoImage.js')


const { response } = require('express');
//const module = require('md5-file');

const PORT = process.env.PORT || 3000;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let httpsServer= app.listen(PORT, () => console.log(`HTTP server listening at https://deskfriend.tk:${PORT}`));
const wsServer = new WebSocket.Server({ server: httpsServer, autoAcceptConnections: false });

// array of connected websocket clients
let connectedClients = [];
var snapshotHour = -1;	// start auto-capping the history feed. 

var visitors;

const instance = axios.create({
    baseURL: 'https://deskfriend.tk',
    timeout: 120000,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
    
wsServer.on('connection',  (ws, req) => {
    console.log('Connected');
 
  
    // listen for messages from the streamer, the clients will not send anything so we don't need to filter
    ws.send("난 app.js다");
    ws.on('close',function(){
        console.log("close ws")
        ws.close()
     
    })
    
    ws.on('message',  async function(message) {
        
      

        if (ws.readyState === ws.OPEN) { // check if it is still connected
            ws.send("연결됐다1");
            //console.log(message);  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
            
            var BASE64_MARKER = ';base64,';
            var base64Index = message.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            var base64 = message.substring(base64Index);    ///9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
            
            var buffer= new Buffer.from(base64, 'base64'); // atob(base64) in window scope
            var imageName = visitors+".jpg";
            console.log(imageName)
            fs.writeFileSync(imageName,buffer, function(e) {
                if(e) {
                    //sys.debug(e);
                } else {
                    //sys.debug("file written, starting upload...");
                    console.log("convertDataURIToBinary(message)")
                }
            });
            const filePath = __dirname + '/'+imageName;
            var newFile = fs.createReadStream(filePath);
        
            // personally I'd function out the inner body here and just call 
            // to the function and pass in the newFile
            const formData = new FormData();
            formData.append('image', newFile,newFile.name);
            // ws.send("연결됐다2");
            
            try{
                var test_result =  await instance.post('/test', formData, {
                    // You need to use `getHeaders()` in Node.js because Axios doesn't
                    // automatically set the multipart form boundary in Node.
                    headers: formData.getHeaders()
                    
                });
                ws.send("이미지 test로 전송했다");
                    
                //res.end();  //클라이언트에게 응답을 전송한다
                

               
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
            
               
        } //else { // if it's not connected remove from the array of connected ws
        // connectedClients.splice(i, 1);
        // } 
        
    });
});


// HTTP stuff
app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './views/client.html')));
app.get('/user_main', (req, res) => res.sendFile(path.resolve(__dirname, './views/user_main.html')));


db_config.connect(conn);

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.use(cookieParser('fvnslfjslkfjslfjslf'));



app.get('/', function (req, res) {
    
    res.redirect('/main');

});

//로그인 페이지 (앱을 키면 가장 먼저 보이는 화면)
//로그인 GET
app.get('/main', function (req, res) {
    res.render('main.html');
   
 });

 

//로그인 POST
app.post('/main', function (req, res) {
    console.log("/main")
    var id = req.body.id;
    var password = req.body.password;

    console.log(id)
    console.log(password)

    conn.query('SELECT * FROM userinfo WHERE id = ?', [id],
    function( error, results) {
        if (error) {
           
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
        } else {
           
            if(results.length > 0) {
                var user=results[0];
                try{
                    
                    if(user.salt==null){
                        res.send('<script type="text/javascript">alert("아이디와 비밀번호가 일치하지 않습니다.");</script>');
                            
                    }
                }catch(error){
                    res.json({
                        message: error.message
                        })  
                    console.log("error on login")
                }
                   
                    
                    crypto.pbkdf2(password,user.salt,100000,64,'sha512',async function(err,derivedKey){
                        if(err)
                            console.log(err);
                        if(derivedKey.toString('base64')==user.password){
                            console.log(results)//로그인 완료
                            
                        
                            var expiryDate = new Date( Date.now() + 60 * 60 * 1000 * 24); // 24 hour 7일
                            res.cookie("user",user.id, {
                                expires:expiryDate,
                                secure:true,
                                signed:true

                            });

                            res.redirect('/pre_user_main');
                        }
                        else {
                            res.send('<script type="text/javascript">alert("아이디와 비밀번호가 일치하지 않습니다.");</script>');
                            
                        }   
                    })
           
            
            }
            else {
                res.send('<script type="text/javascript">alert("아이디가 존재하지 않습니다. 회원가입을 진행해주세요.");</script>');
            }
        }    
    });
});



//회원가입페이지
//register GET
app.get('/register', function (req, res) {
    
    res.render('register.html');

});

 
//register POST
//사용자가 회원가입 버튼을 눌렀을 때 실행되어 db에 정보 저장
app.post('/registerAf', function (req, res) {
   try{
    var body = req.body;
    console.log(body);
    
   
    var salt='';
    
        crypto.randomBytes(64,function(err,buf){
            salt = buf.toString('base64');
            console.log('salt', salt);
            
            crypto.pbkdf2(body.pswd1,salt,100000,64,'sha512',  async function(err, key){
                console.log('password', key.toString('base64'));  // 'dWhPkH6c4X1Y71A/DrAHhML3DyKQdEkUOIaSmYCI7xZkD5bLZhPF0dOSs2YZA/Y4B8XNfWd3DHIqR5234RtHzw=='
                
                var sql = 'INSERT INTO userinfo VALUES(?, ?, ? ,?, ?,?,?,?)';
                var params = [body.id, key.toString('base64'), salt, body.name,body.gender,body.yy,body.mm,body.dd];
                console.log(sql);
                conn.query(sql, params, function(err) {
                    if(err) {
                        console.log('query is not excuted. insert fail...\n' + err);
                        res.send('<script type="text/javascript">alert("아이디가 이미 존재합니다.");</script>');
            
                        return;
                    }
                    else {
                        

                        var sql = 'INSERT INTO alarm VALUES(?, ?, ? ,?)';
                        var params = [body.id, 0,0,0];
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

                
            })
            
        });
        
   }catch(err){
       console.log(err);
   }

    
    
});





//로그인 성공시 사용자에게 보여지는 주요 페이지 (제일 중요한 서비스 구동하는 html, 여기서 웹캠이 구동되고 서버로 전달됨)
app.get('/user_main', function (req, res) {
    console.log("/user_main")
    visitors = req.signedCookies.user;
    console.log(visitors)
    exports.aaa=function(){return visitors}
    res.render('user_main.html');


});



app.get('/pre_user_main', function (req, res) {
 
    visitors = req.signedCookies.user;
    console.log(visitors)
    
    res.render('pre_user_main.html');
    

});

exports.aaa=function(){return visitors}

app.get('/logout',function(req,res){//로그아웃기능
  
    res.clearCookie("user").redirect("/main");	
});


//알람을 몇 시간 주기로 할 건지 설정하는 화면
app.get('/alarm_settings', function (req, res) {
  
    res.render('alarm_settings.html');

});

app.post('/alarm_settingsAf', function (req, res) {

    visitors = req.signedCookies.user;
    console.log(visitors);

    var starttime = req.body.starttime;
    var posture = req.body.posture;
    var period = req.body.period;

    var sql= 'UPDATE alarm SET starttime=?,posture=?,period=? WHERE id= ?';
    var params = [starttime, posture,period,visitors];
    console.log(sql);
    conn.query(sql, params, function(err) {
        if(err) {
            console.log('query is not excuted. update fail...\n' + err);
            return;
        }
        
    });
    res.redirect("/user_main");

});



//알람 끄고 키는 설정 화면
app.get('/onoff_settings', function (req, res) {
    
    res.render('onoff_settings.html');

});





/////////////////////////서버간 연결//////////////////////////

//이미지를 nodejs 서버에서 colab 서버로 넘기는 코드

var multerOption = require('./module/multerOption.js');

 
app.post('/test', multerOption.single('image'),  async (req, res) => {
  
    fileName = req.file['filename']
    hash = md5File.sync('userUpload/'+fileName)

     
    
    try{
      var axiosResponse = await axiosRequest('userUpload/'+fileName)
     
      if(axiosResponse.status == 200){
        responseData = axiosResponse.data
      
        var flaskdata={
            hash : hash,
            text: responseData["text"],
            flag : responseData["flag"]
        }
       
        res.json(flaskdata)
                
        
    }else{
    res.json({
        hash:          hash     
        })  
    }
    }catch(e){console.log("[ERROR|axiosResponse] : ",e)}
    console.log(flaskdata)
    console.log("success flaskdata image")

});



app.post('/makefile',   async (req, res) => {
   
    var imgmessage = req.body.id;

    var BASE64_MARKER = ';base64,';
    var base64Index = imgmessage.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = imgmessage.substring(base64Index);    ///9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
    
    var buffer= new Buffer.from(base64, 'base64'); // atob(base64) in window scope

    var preimageName = visitors+".jpg";
    console.log(preimageName)

    fs.writeFileSync(preimageName ,buffer, function(e) {
        if(e) {
            //sys.debug(e);
        } else {
            //sys.debug("file written, starting upload...");
            console.log("convertDataURIToBinary(req)")
        }
    });
    const filePath = __dirname + '/'+preimageName;
    var newFile = fs.createReadStream(filePath);
    
  
    // personally I'd function out the inner body here and just call 
    // to the function and pass in the newFile
    const formData = new FormData();
    formData.append('image', newFile,newFile.name);
   
    
    try{
        var test_result =  await instance.post('/pre_test', formData, {
            // You need to use `getHeaders()` in Node.js because Axios doesn't
            // automatically set the multipart form boundary in Node.
            headers: formData.getHeaders()
            
        });
            
      
        console.log("post image to pre_test")
        console.log(test_result)
        console.log(test_result.status)
        console.log(test_result.data)
        
        if(test_result.status == 200){
            test_result_responsedata = test_result.data
            console.log("ssssssssssss")
            console.log(test_result_responsedata)
            
        }
        res.json(test_result.data)       
    }catch(e){console.log("[ERROR|success pass pre_test error] : ",e)}
});



app.post('/pre_test', multerOption.single('image'),  async (req, res) => {

    fileName = req.file['filename']
    hash = md5File.sync('userUpload/'+fileName)
   
     
    try{
      var preaxiosResponse = await preaxiosRequest('userUpload/'+fileName)
     
      if(preaxiosResponse.status == 200){
        preresponseData = preaxiosResponse.data
       
        var flaskdata={
            hash : hash,
            text: preresponseData["text"],
            flag : preresponseData["flag"]
        }
        
        res.json(flaskdata)
                
        
    }else{
    res.json({
        hash:          hash     
        })  
    }
    }catch(e){console.log("[ERROR|preaxiosRequest] : ",e)}
    console.log(flaskdata)
    console.log("success flaskdata image")

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


