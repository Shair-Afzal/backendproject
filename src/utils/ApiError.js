class ApiError extends Error{
    constructor(
        statuscode,
        message="somethink went wrong",
        errors=[],
        stack="",
    ){
        super(message)
        this.statuscode=statuscode,
        this.message=message,
        this.errors=errors,
        this.data=null,
        this.success=false
        if(stack){
            this.stack=statuscode
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}
export {ApiError}