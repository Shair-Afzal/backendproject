const asynchandler=(reqhandler)=>{
    return (req,resp,next)=>{
   Promise.resolve(reqhandler(req,resp,next)).catch(err=>next(err))
    }
}

export {asynchandler}