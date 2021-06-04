const FormData = require('form-data');
const axios = require('axios')
const fs = require('fs')
const axiosRequest = async (filePath)=>{
  var newFile = fs.createReadStream(filePath);
  const formData = new FormData();
  formData.append("file", newFile, newFile.name);
  
  console.log(formData)
  try{
    var response = await axios.create({headers: formData.getHeaders()}).post(".../Predict/predict", formData)

    return response
  } catch(e){
    console.log("[ERROR|axiosRequest] ", e) 
    return e
  }
}
module.exports = axiosRequest
