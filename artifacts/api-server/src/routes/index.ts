import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import usersRouter from "./users";
import wishlistRouter from "./wishlist";
import messagesRouter from "./messages";
import categoriesRouter from "./categories";
import offersRouter from "./offers";
import notificationsRouter from "./notifications";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(listingsRouter);
router.use(usersRouter);
router.use(wishlistRouter);
router.use(messagesRouter);
router.use(categoriesRouter);
router.use(offersRouter);
router.use(notificationsRouter);

export default router;
