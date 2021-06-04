
const FormData = require('form-data');
const axios = require('axios')
const fs = require('fs')
const preaxiosRequest = async (filePath)=>{
  var newFile = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append("file", newFile, newFile.name);
  
  console.log(formData)
  try{
    var response = await axios.create({headers: formData.getHeaders()}).post("http://.../Predict/prepare", formData)
    console.log("3333333333333")
    return response
  } catch(e){
    console.log("[ERROR|preaxiosRequest] ", e) 
    return e
  }
}
module.exports = preaxiosRequest
