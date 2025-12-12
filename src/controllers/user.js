import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandrefreshToken = async (userid) => {
  try {
    console.log(userid);
    const user = await User.findById(userid);
    console.log("user in db ", user);
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });
    return { accesstoken, refreshtoken };
  } catch (err) {
    console.error("❌ Error inside generateAccessandrefreshToken:", err);
    throw new ApiError(
      404,
      "something is wrong on genreating access and refresh token"
    );
  }
};

const registeruser = asynchandler(async (req, resp) => {
  const { username, fullname, email, password } = req.body;

  if (
    [fullname, username, email, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new ApiError(409, "user with username and email is laredy exist");
  }
  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  const coverimagelocalpath = req.files?.coverimage?.[0]?.path;
  if (!avatarlocalpath) {
    console.log("FILES RECEIVED:", req.files);
    throw new ApiError(400, "avatar  is required");
  }
  const avatar = await UploadonCloudinary(avatarlocalpath);
  const coverimage = await UploadonCloudinary(coverimagelocalpath);
  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url || "",
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiError(500, "internal server Error");
  }
  return resp
    .status(201)
    .json(new ApiResponse(200, createduser, "User is Regisred successfully"));
});

const loginuser = asynchandler(async (req, resp) => {
  const { email, password, username } = req.body;
  if (!(email || username)) {
    throw new ApiError(404, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const ispasswordvalid = await user.isPasswordCorrect(password);
  if (!ispasswordvalid) {
    throw new ApiError(404, "invalid user credentails");
  }
  const { accesstoken, refreshtoken } = await generateAccessandrefreshToken(
    user._id
  );
  const logedinuser = await User.findById(user._id).select(
    "-password,-refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return resp
    .status(200)
    .cookie("accesstoken", accesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: logedinuser,
          accesstoken,
          refreshtoken,
        },
        "user logedin successfully"
      )
    );
});

const logoutuser = asynchandler(async (req, resp) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  resp
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(new ApiResponse(200, {}, "user logout suuccessfully"));
});

const refreshaccesstoken = asynchandler(async (req, resp) => {
  const incommingrefreshtoken =
    req.cookies.refreshtoken || req.body.refreshToken;
  if (!incommingrefreshtoken) {
    throw new ApiError(404, "unautherized request");
  }
  try {
    const decoded = jwt.verify(
      incommingrefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded?._id);
    if (!user) {
      throw new ApiError(404, "invalid refresh token");
    }
    if (incommingrefreshtoken !== user?.refreshToken) {
      throw ApiError(401, "refresh token is expired ");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accesstoken, refreshtoken } = await generateAccessandrefreshToken(
      user?._id
    );
    resp
      .status(200)
      .cookie("accesstoken", options)
      .cookie("refreshtoken", options)
      .json(
        new ApiResponse(
          200,
          {
            accesstoken,
            refreshtoken,
          },
          "Access token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(404, "inavlid or exipred refreshtoken");
  }
});

const changeuserpassword = asynchandler(async (req, resp) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user._id);
  const ispassword = await user.isPasswordCorrect(oldpassword);
  if (!ispassword) {
    throw new ApiError(400, "old password is incorrect");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });
  resp
    .status(200)
    .json(new ApiResponse(200, {}, "user password changed successfully"));
});

const currentuser = asynchandler(async (req, resp) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  resp
    .status(200)
    .json(new ApiResponse(200, user, "current user fetched successfully"));
});

const updateuserAccount = asynchandler(async (req, resp) => {
  const { fullname, username, email } = req.body;
  if (!fullname || !username || !email) {
    throw new ApiError(400, "all fields are required");
  }
  const updateduser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        username,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return resp.status(200).json(
    new ApiResponse(200, updateduser, "user account updated successfully")
  );
});

const updateAvtar= asynchandler(async (req, resp) => {
  const avatarlocalpath = req.file?.path;
  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar  is required");
  }
  const avatar = await UploadonCloudinary(avatarlocalpath);
  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }
await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar:avatar.url||"",
    },
    { new: true }
  );
  resp
    .status(200)
    .json(new ApiResponse(200, {}, "user avatar updated successfully"));
});
const updatecoverimage= asynchandler(async (req, resp) => {
  const coverimagelocalpath = req.file?.path;
  if (!coverimagelocalpath) {
    throw new ApiError(400, "coverimage  is required");
  }
  const coverimage = await UploadonCloudinary(coverimagelocalpath);
  if (!coverimage) {
    throw new ApiError(400, "coverimage is required");
  }
await User.findByIdAndUpdate(
    req.user._id,
    {
      coverimage:coverimage.url||"",
    },
    { new: true }
  );
  resp
    .status(200)
    .json(new ApiResponse(200, {}, "user cover image updated successfully"));
});

const getuserprofile = asynchandler(async (req, resp) => {
   const {username}=req.params;
   if(!username?.trim()){
    throw new ApiError(400,"username is required");
   }
   const channel=await User.aggregate([
    {
      $match:{username:username?.toLowerCase()}
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedtochannels"
      }
    },
    {
      $addFields:{
        subscriberscount:{$size:"$subscribers"},
        subscribedtochannelscount:{$size:"$subscribedtochannels"},
       isfolow: {
  $cond: {
    if: { $in: [req.user._id, "$subscribers.subscriber"] },
    then: true,
    else: false
  }
}
      }

    },
    {
      $project:{
        fullname:1,
        username:1,
        email:1,
        avatar:1,
        coverimage:1,
        createdAt:1,
        subscriberscount:1,
        subscribedtochannelscount:1,
        isfolow:1
    }
  }

   ])

   if(!channel?.length){
    throw new ApiError(404,"user not found");
   }
   resp
   .status(200)
   .json(new ApiResponse(200, channel[0], "user profile fetched successfully"));
});

const getuserwatchhistory= asynchandler(async (req, resp) => {
  const user=await User.aggregate([
    {
      $match:{
        id:new mongoose.Types.ObjectId(req.user._id)

      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchhistory",
        foreignField:"_id",
        as:"watchhistoryvideos",
        pipline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"ownerdetails",
              pipline:[
                { $project:{
                  fullname:1,
                  username:1,
                  avatar:1
                }}
              ],
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$ownerdetails"
              }
            }
          }
        ]

      }
    }
  ]); 
  if(!user?.length){
    throw new ApiError(404,"user not found");
  }
  return resp
  .status(200)
  .json(new ApiResponse(200, user[0]?.watchhistoryvideos||[], "user watch history fetched successfully"));
})

export {
  registeruser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  changeuserpassword,
  currentuser,
  updateuserAccount,
  updateAvtar,
  updatecoverimage,
  getuserprofile,
  getuserwatchhistory,
};
