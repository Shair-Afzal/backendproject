import {asynchandler} from "../utils/asynchandler.js"

const registeruser=asynchandler(async (req,resp)=>{
    resp.status(200).json({
        message:"ok"
    })
})

export {registeruser}