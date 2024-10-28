import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    const like = await Like.findOne({likedBy: req.user._id, video: videoId})

    if(like){
        await Like.deleteOne({likedBy: req.user._id, video: videoId})
    }else{
        await Like.create({likedBy: req.user._id, video: videoId})
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video liked/unliked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    const like = await Like.findOne({likedBy: req.user._id, comment: commentId})

    if(like){
        await Like.deleteOne({likedBy: req.user._id, comment: commentId})
    }else{
        await Like.create({likedBy: req.user._id, comment: commentId})
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment liked/unliked successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    const like = await Like.findOne({likedBy: req.user._id, tweet: tweetId})

    if(like){
        await Like.deleteOne({likedBy: req.user._id, tweet: tweetId})
    }else{
        await Like.create({likedBy: req.user._id, tweet: tweetId})
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet liked/unliked successfully")
    )

})

const getLikedVideos = asyncHandler(async (req, res) => {

    const likes = await Like.find({likedBy: req.user._id})

    if(!likes){
        throw new ApiError(404, "No likes found");
    }

    const videoIds = likes.map(like => like.video)

    const videos = await Video.find({_id: {$in: videoIds}})

    if(!videos){
        throw new ApiError(404, "No videos found");
    }



    return res
    .status(200)
    .json(
        new ApiResponse(200, likes, "Liked videos retrieved successfully")
    )

})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}