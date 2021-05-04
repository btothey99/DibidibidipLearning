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
var preaxiosRequest = require('./module/preaxiosRequest.js');
var multerOption = require('./module/multerOption.js');



var http = require('http');
var WebSocket = require('ws');
var atob = require('atob');
var Blob = require('cross-blob');
var FileReader = require('FileReader');
var querystring = require('querystring');
//const httpServer = http.createServer(app);
//var https = require('https').createServer({});
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var crypto = require('crypto');
var dbOptions = db_config;
var cookieParser=require('cookie-parser');



const mongoose = require('mongoose')
const schema = require('./mongoImage.js')

//const Image = mongoose.model('Image', schema.imageSchema);

var sanitizeHtml = require('sanitize-html');

const { response } = require('express');

const PORT = process.env.PORT || 3000;
let httpServer= app.listen(PORT, () => console.log(`HTTP server listening at http://localhost:${PORT}`));
const wsServer = new WebSocket.Server({ server: httpServer });

// array of connected websocket clients
let connectedClients = [];
var snapshotHour = -1;	// start auto-capping the history feed. 
var imageName = "image.jpg";
var preimageName = "preimage.jpg";



    
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
            //console.log(message);  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
            
            var BASE64_MARKER = ';base64,';
            var base64Index = message.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
            var base64 = message.substring(base64Index);    ///9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
            
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

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
// app.use(session({
//     secret:'!@#$%^&*',
//     store: new MySQLStore(dbOptions),
//     resave: false,
//     saveUninitialized:false
// }));
app.use(cookieParser('fvnslfjslkfjslfjslf'));



app.get('/', function (req, res) {
    // if(!req.session.name)
    //     res.redirect('/main');
    // else   
        res.redirect('/pre_user_main');

});

//로그인 페이지 (앱을 키면 가장 먼저 보이는 화면)
//로그인 GET
app.get('/main', function (req, res) {
    //if(!req.session.name)
        res.render('main.html');
    // else  
    //     res.redirect('/pre_user_main');

 });

 

//로그인 POST
app.post('/main', function (req, res) {
    
    var id = req.body.id;
    var password = req.body.password;

    console.log(id)
    console.log(password)

    conn.query('SELECT * FROM userinfo WHERE id = ?', [id],
    function( error, results) {
        if (error) {
            // console.log("error ocurred", error);
            res.send({
                "code": 400,
                "failed": "error ocurred"
            })
        } else {
            // console.log('The solution is: ', results);
            if(results.length > 0) {
                
                    var user=results[0];
                    
                    
                    crypto.pbkdf2(password,user.salt,100000,64,'sha512',async function(err,derivedKey){
                        if(err)
                            console.log(err);
                        if(derivedKey.toString('base64')==user.password){
                            console.log(results)//로그인 완료
                            
                            //req.session.name=user.name;
                            // req.session.save(function(){
                            //     return res.redirect('/pre_user_main');
                            // });
                            var expiryDate = new Date( Date.now() + 60 * 60 * 1000 * 24); // 24 hour 7일
                            res.cookie("user",user.id, {
                                expires:expiryDate,
                                httpOnly:true,
                                signed:true
                    
                            });

                            res.redirect('/pre_user_main');
                        }
                        else {
                            res.send({
                                "code": 204,
                                "success": "Email and password does not match"
                            });
                        
                        }
                    })
                   
                    
                
                
            }
            else {
                res.send({
                    "code":204,
                    "success": "Email does not exists"
                });
            }
        }    
    });
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
    
    // //암호화 복호화 set
    // var key = 'mykey';
    // var cipher = crypto.createCipher('aes192',key);
    // var decipher = crypto.createDecipher('aes192',key);

    // //암호화(utf8을 base64로 암호화 시킴)
    // cipher.update(body.pswd1,'utf8','base64');
    // var cipheredOutput = cipher.final('base64');

    // //공백란 찾기
    // if(blackSearch(body.pswd1,body.name,body.yy,body.mm,body.dd)){
    //     console.log("공백");
    //     res.send("공백");
    // }
    var salt='';
    //else{
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
                        return;
                    }
                    else res.redirect('/main');
                });

                var sql = 'INSERT INTO alarm VALUES(?, ?, ? ,?, ?)';
                var params = [body.id, 0,0,0,0];
                console.log(sql);
                conn.query(sql, params, function(err) {
                    if(err) {
                        console.log('query is not excuted. insert fail...\n' + err);
                        return;
                    }
                    else res.redirect('/main');
                });
            })
            
        });
        
  

               
        // decipher.update(cipheredOutput,'base64','utf8');
        // var decipheredOuput=decipher.final('utf8');

        // console.log('원문 : '+pswd1);//원본
        // console.log('암호화 : '+cipheredOutput);//암호화
        // console.log('복호화 : '+decipheredOuput);//복호화
    //}
   }catch(err){
       console.log(err);
   }

    
    
});





//로그인 성공시 사용자에게 보여지는 주요 페이지 (제일 중요한 서비스 구동하는 html, 여기서 웹캠이 구동되고 서버로 전달됨)
app.get('/user_main', function (req, res) {
    
    res.render('user_main.html');


});

// app.post('/user_main', function (req, res) {
//     console.log("aaaaaaaaaaa")
//     res.json({data : req.body})
// });


app.get('/pre_user_main', function (req, res) {
    // if(!req.session.name)
    //     return res.redirect('/main');
    // else
    var visitors = req.signedCookies.user;
    console.log(visitors)

    res.render('pre_user_main.html');
    

});

app.get('/logout',function(req,res){//로그아웃기능
    res.clearCookie("loginObj");	
	res.redirect("/main");
});


//알람을 몇 시간 주기로 할 건지 설정하는 화면
app.get('/alarm_settings', function (req, res) {
    // var visitors = req.signedCookies.user;//들어가면 이전에 설정했던거 보이는 부분 
    // console.log(visitors);

 
    // conn.query('select * from alarm WHERE id= ?', [visitors],
    // function( error, results) {
    //     if (error) {
    //         console.log('query is not excuted. select fail...\n' + err);
    //         return;
    //     }
    //     else{
    //         let predata = {
    //             starttime : results[0].starttime,
    //             posture_start:results[0].posture_start,
    //             posture_end:results[0].posture_end,
    //             period:results[0].period
    //         }

    //         try{
    //             var responsedata =  axios.post('http://localhost:3000/alarm_settings',  JSON.stringify(predata), {
    //             headers: {
    //                 'Content-Type': `application/json`,
    //             }
    //             })
    //             console.log(".....")
    //             console.log(responsedata)
    //         }catch(e){console.log("[ERROR|success alarm data error] : ",e)}
           
    //     }
        
    // });

    res.render('alarm_settings.html');

});

app.post('/alarm_settingsAf', function (req, res) {

    var visitors = req.signedCookies.user;
    console.log(visitors);

    var starttime = req.body.starttime;
    var posture_start = req.body.posture_start;
    var posture_end = req.body.posture_end;
    var period = req.body.period;
    console.log(posture_end);

    var sql= 'UPDATE alarm SET starttime=?,posture_start=?,posture_end=?,period=? WHERE id= ?';
    var params = [starttime, posture_start,posture_end,period,visitors];
    console.log(sql);
    conn.query(sql, params, function(err) {
        if(err) {
            console.log('query is not excuted. update fail...\n' + err);
            return;
        }
        
    });

    

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
            text: responseData["text"],
            flag : responseData["flag"]
        }
        //Image.create(flaskdata)
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



app.post('/makefile',   async (req, res) => {
    console.log("mmmmmmmmmmmmmmmm");
    //console.log(message);
    var imgmessage = req.body.id;
    //console.log(imgmessage);


    var BASE64_MARKER = ';base64,';
    var base64Index = imgmessage.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = imgmessage.substring(base64Index);    ///9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMC
    
    var buffer= new Buffer.from(base64, 'base64'); // atob(base64) in window scope



    fs.writeFileSync(preimageName ,buffer, function(e) {
        if(e) {
            //sys.debug(e);
        } else {
            //sys.debug("file written, starting upload...");
            console.log("convertDataURIToBinary(req)")
        }
    });
    const filePath = __dirname + '\\preimage.jpg';
    var newFile = fs.createReadStream(filePath);
    
    //console.log(newFile)
    // personally I'd function out the inner body here and just call 
    // to the function and pass in the newFile
    const formData = new FormData();
    formData.append('image', newFile,newFile.name);
   
    
    try{
        var test_result =  await axios.post('http://localhost:3000/pre_test', formData, {
            // You need to use `getHeaders()` in Node.js because Axios doesn't
            // automatically set the multipart form boundary in Node.
            headers: formData.getHeaders()
            
        });
            
        //res.end();  //클라이언트에게 응답을 전송한다
        

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
    //console.log(req.file); 
    fileName = req.file['filename']
    console.log('////////////////////////////')
    hash = md5File.sync('userUpload/'+fileName)
    //console.log(fileName)
     
    
    try{
      var preaxiosResponse = await preaxiosRequest('userUpload/'+fileName)
      //console.log("[axiosResponse] : ", axiosResponse)
      if(preaxiosResponse.status == 200){
        preresponseData = preaxiosResponse.data
        //var flaskdata = responseData["text"]
        var flaskdata={
            hash : hash,
            text: preresponseData["text"],
            flag : preresponseData["flag"]
        }
        //Image.create(flaskdata)
        res.json(flaskdata)
                
        
    }else{
    res.json({
        hash:          hash     
        })  
    }
    }catch(e){console.log("[ERROR|preaxiosRequest] : ",e)}
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
