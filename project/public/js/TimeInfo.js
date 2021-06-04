var db_config = require( './config/database.js');

var visitors = req.signedCookies.user; 
console.log(visitors);

function getTimeOut(){
    console.log(timeOut);
    return timeOut;
}
