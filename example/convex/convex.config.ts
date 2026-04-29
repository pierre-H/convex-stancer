import { defineApp } from "convex/server";
import stancer from "../../src/component/convex.config.js";

const app = defineApp();
app.use(stancer);

export default app;
