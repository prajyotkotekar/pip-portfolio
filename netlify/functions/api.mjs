import { getStore } from "@netlify/blobs";
import { createNetlifyHandler } from "../../server/netlify.mjs";

export default createNetlifyHandler(getStore);

export const config = { path: "/api/*" };
