import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos with pagination, sorting, and filtering
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const filters = {};
    if (query) {
        filters.title = { $regex: query, $options: "i" }; // case-insensitive search
    }
    if (userId && isValidObjectId(userId)) {
        filters.owner = userId; // filter by user ID
    }

    const totalVideos = await Video.countDocuments(filters);
    const videos = await Video.find(filters)
        .populate("owner", "username email") // populate owner details
        .sort({ [sortBy]: sortType === 'asc' ? 1 : -1 }) // sorting
        .skip((page - 1) * limit) // pagination
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, videos, "Videos retrieved successfully", { total: totalVideos, page, limit }));
});

// Publish a new video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, isPublished } = req.body;
    const videoFile = req.files?.videoFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    // Upload files to Cloudinary
    const videoUploadResult = await uploadOnCloudinary(videoFile.path);
    const thumbnailUploadResult = await uploadOnCloudinary(thumbnailFile.path);

    const video = await Video.create({
        title,
        description,
        duration,
        isPublished,
        videoFile: videoUploadResult.secure_url, // Cloudinary URL
        thumbnail: thumbnailUploadResult.secure_url, // Cloudinary URL
        owner: req.user._id, // Assuming req.user is populated by your auth middleware
    });

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username email");
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video retrieved successfully"));
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, duration, isPublished } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Update the fields if provided
    video.title = title || video.title;
    video.description = description || video.description;
    video.duration = duration || video.duration;
    video.isPublished = isPublished !== undefined ? isPublished : video.isPublished;

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

// Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Assuming you have a utility to delete files from Cloudinary
    const videoFileId = video.videoFile.split('/').pop().split('.')[0];
    const thumbnailFileId = video.thumbnail.split('/').pop().split('.')[0];

    await deleteFromCloudinary(videoFileId);
    await deleteFromCloudinary(thumbnailFileId);

    await video.remove();

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished; // Toggle the published status
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
