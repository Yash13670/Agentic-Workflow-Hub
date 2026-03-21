import { Router, type IRouter } from "express";
import { RunWorkflowBody } from "@workspace/api-zod";
import { runPipeline } from "../agents/pipeline.js";

const router: IRouter = Router();

router.post("/workflow/run", async (req, res) => {
  try {
    const parsed = RunWorkflowBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request: meetingNotes is required" });
      return;
    }

    const { meetingNotes } = parsed.data;
    const result = await runPipeline(meetingNotes);

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Workflow pipeline error");
    res.status(500).json({ error: "Workflow pipeline failed. Please try again." });
  }
});

export default router;
