const cloudinary=require('cloudinary').v2
require('dotenv').config();

exports.connectWithCloudinary=()=>{
   
    try{
        cloudinary.config({
          cloud_name:process.env.CLOUDINARY_CLOUDNAME,
          api_key:process.env.CLOUDINARY_APIKEY,
          api_secret:process.env.CLOUDINARY_APISECRET,
        })

        console.log("connected")
      }catch(err)
      {
          console.log("error in cloudinary",err)
      }

}

