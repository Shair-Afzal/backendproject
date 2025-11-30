import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const VideoSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
   VideoFile:{
    type:String,
    require:true,
   },
    thumbnail:{
    type:String,
    require:true,
   },
   description:{
     type:String,
        required:true,
   },
   duration:{
    type:Number,
    required:true,
   },
   views:{
    type:Number,
    default:0,
   },
   ispublished:{
    type:Boolean,
    default:true
   },
   owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
   }
        
    
},{timestamps:true})
VideoSchema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",VideoSchema)