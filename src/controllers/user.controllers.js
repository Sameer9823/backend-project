import {asyncHandler  } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

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
                $set: {
                    refreshToken: undefined
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



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};