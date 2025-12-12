import { Router } from "express";
import { loginuser, logoutuser, refreshaccesstoken, registeruser,changeuserpassword, currentuser, updateuserAccount, updateAvtar, updatecoverimage, getuserprofile } from "../controllers/user.js";
import { upload } from "../middlewares/multer.middlwares.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registeruser
);


router.route("/login").post(loginuser)

router.route("/logout").post(verifyjwt,logoutuser)
router.route("/Refresh-token").post(refreshaccesstoken)
router.route("/changepassword").post(verifyjwt, changeuserpassword)
router.route("/currentuser").get(verifyjwt,currentuser)
router.route("/updateaccount").post(verifyjwt, updateuserAccount)
router.route("/updateavatar").post(verifyjwt,upload.single("avatar"), updateAvtar);
router.route("/updatecoverimage").post(verifyjwt,upload.single("coverimage"), updatecoverimage);
router.route("/getprofile/:username").get(verifyjwt,getuserprofile);


export default router;
