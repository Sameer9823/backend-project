// import {asyncHandler} from "../utils/asyncHandler.js"
// import {ApiError} from "../utils/ApiError.js"
// import {Video} from "../models/video.models.js"
// import {ApiResponse} from "../utils/ApiResponse.js"


// // Upload a new video

// const uploadVideo = asyncHandler(async(req, res) => {

//     const {title, description, duration, isPublished} = req.body
//     const videoFile = req.files?.videoFile?.[0]?.path;
//     const thumbnail = req.files?.thumbnail?.[0]?.path;

//     if(!videoFile || !thumbnail){
//         throw new ApiError(400, "Video file and thumbnail are required")
//     }
//     const video = await Video.create({
//         videoFile,
//         thumbnail,
//         title,
//         description,
//         duration,
//         isPublished,
//         owner: req.user._id
//     })

   

//     return res
//     .status(201)
//     .json(
//         new ApiResponse(201, video, "Video uploaded successfully")
//     );

// });

// // Get a list of videos (with pagination)

// const getVideos = asyncHandler(async(req, res) => {




// // Get a specific video by its ID
// // Update video details
// // Delete a video
// // Increment video views
// // Publish/Unpublish a video

