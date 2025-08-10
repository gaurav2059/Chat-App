import express from "express"
import { signup, login, checkAuth, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = express.Router();



userRouter.post("/login", login);
userRouter.post("/signup", signup);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check-auth", protectRoute, checkAuth);
export default userRouter;