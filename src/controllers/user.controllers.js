import {asyncHandler  } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import {deleteFromCloudinary} from "../utils/imagedelete.js"

const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
        
    }

}

//REGISTER USER
const registerUser = asyncHandler(async(req, res) => {
    // get user details from frontend
    //validation - not empty
    //check if user already exists: username , email
    // check for images , check for avatar
    // uplaod them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and reresh token field from response
    // check for user creation 
    // return res   

    const {fullName, email, password, username} = req.body
    // console.log("email:", email);
    
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required ");
        
    }

   const existedUser= await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists");
    }
    // console.log(req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path;
        
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar upload failed");
    }

   const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        
    })
    
    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating user");
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is created successfully")
    )

})


//LOGIN USER

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //validation username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email, password, username} = req.body
    if(!username && !email){
        throw new ApiError(400, "username or email are required");
    }

    const user = await User.findOne({

        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid password");
  }

 const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)
 
 const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
           {
            user: loggedInUser, accessToken, refreshToken
           },
            "User logged in successfully"
        )
    )



})

//LOGOUT USER

const logoutUser = asyncHandler(async (req, res) => {
      await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
        {
            new: true
        }
        )
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
    
})

//rfresh token
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }

   try {
     const decoded = jwt.verify(
         incomingRefreshToken, 
         process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decoded?._id)
     if(!user) {
         throw new ApiError(401, 'invalid rfresh token')
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refreshtoken is expire or used");
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
 
      const {accessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(200, 
            {
             user, 
             accessToken, 
             refreshToken: newRefreshToken
            },
             "Access token refreshed successfully"
         )
     )
   } catch (error) {
     throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }
})

//update password
const changeCurrentPassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})


//get current user
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "User retrieved successfully")
    )
})

//update account details

const updateAccountDetail = asyncHandler(async (req, res)=> {

    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )

})




//update avatar

const updatedAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    //check if there is an existing avatar and delete it

    const user = await User.findById(req.user?._id)

    if(user?.avatar){
        const oldAvatarPublicId = user.avatar.split('/').pop().split('.')[0];

        await deleteFromCloudinary(oldAvatarPublicId)
    }

   const avatar =  await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
       throw new ApiError(500, "Something went wrong while uploading avatar");
   }
   //update user avatar in database

   user.avatar = avatar.url

   await user.save({validateBeforeSave: false})


//    const user = await User.findByIdAndUpdate(
//        req.user?._id,
//        {
//            $set: {
//                avatar: avatar.url
//            }
//        },
//        {new: true}
//    ).select("-password")

   return res
   .status(200)
   .json(
       new ApiResponse(200, user, "Avatar updated successfully")
   )

})

//update coverimage

const updatedCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required");
    }

    const user = await User.findById(req.user?._id)

    if(user?.coverImage){
        const oldCoverImagePublicId = user.coverImage.split('/').pop().split('.')[0];

        await deleteFromCloudinary(oldCoverImagePublicId)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500, "Something went wrong while uploading cover image");
    }

    user.coverImage = coverImage.url;

    await user.save({validateBeforeSave: false})

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: {
    //             coverImage: coverImage.url
    //         }
    //     },
    //     {new: true}
    // ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
    



})

//channel profile
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing");

    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, 
        
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriptions"
            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                }
            }
        }
        },

        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                isSubscribed: 1
            }
        }
    
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel profile retrieved successfully")
    )

})

//watch history

const getWatchHistory = asyncHandler(async(req, res) => {

    const user = await User.aggregate([
        {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup: {
            from: "video",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "user",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $arrayElemAt: ["$owner", 0]
                        }
                    }
                }
            ]
        }
    }
])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history retrieved successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updatedAvatar,
    updatedCoverImage,
    getUserChannelProfile,
    getWatchHistory

};