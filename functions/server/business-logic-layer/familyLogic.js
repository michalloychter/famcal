const jwt = require("jsonwebtoken");
 require('dotenv').config();
const UserModel = require('./userModel'); 


 async function checkdata(user){
    const result= await UserCollection.werre( "userName","==",String(user.useName))
}