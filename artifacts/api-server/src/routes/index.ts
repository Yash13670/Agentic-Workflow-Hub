import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workflowRouter from "./workflow";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workflowRouter);

export default router;
