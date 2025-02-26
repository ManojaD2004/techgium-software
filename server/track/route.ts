import express from "express";
const trackRouter = express.Router();
const v1Routes = express.Router();

trackRouter.use("/v1", v1Routes);

v1Routes.get("/live/:port", async (req, res) => {
  try {
    const response = await fetch(
      `http://localhost:${req.params.port}/video_feed`
    );
    const reader = response.body?.getReader();
    if (!reader) {
      res.status(500).send("Error: Response body is not readable");
      return;
    }
    res.setHeader(
      "Content-Type",
      response.headers.get("Content-Type") || "video/mjpeg"
    );
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(value);
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).send("Failed to fetch video stream");
  }
});

export { trackRouter };
