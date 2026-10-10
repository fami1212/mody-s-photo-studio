import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** Resolve the serving origin without baking a preview domain into share tags. */
export const getRequestOrigin = createServerFn({ method: "GET" }).handler(() => {
  const request = getRequest();
  const url = new URL(request.url);
  const sandboxHost = url.hostname === "localhost"
    ? request.headers.get("x-forwarded-host")
    : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
});