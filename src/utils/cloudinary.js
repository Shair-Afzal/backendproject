import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLUDE_NAME, 
        api_key: process.env.CLUDINARY_API_KEY, 
        api_secret: process.env.CLUDINARY_API_SECRET
    });
 
const UploadonCloudinary=async (localfilepath)=>{
    try{
        if(!localfilepath)return null
        const uploadfile = await cloudinary.uploader
       .upload(localfilepath,{
          resource_type:"auto"
       })
       fs.unlinkSync(localfilepath)
       return uploadfile

    }catch(err){
      fs.unlinkSync(localfilepath)
      return null
    }


}
export {UploadonCloudinary}
    