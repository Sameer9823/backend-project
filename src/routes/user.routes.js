import {Router} from "express";
import {
    loginUser,  
    logoutUser,  
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    updateAccountDetail, 
    updatedAvatar, 
    updatedCoverImage, 
    getUserChannelProfile, 
    getWatchHistory,
    getCurrentUser
} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-detail").patch(verifyJWT, updateAccountDetail)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updatedAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updatedCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)






export default router;