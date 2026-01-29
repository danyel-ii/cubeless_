 "use client";

import { useEffect } from "react";
import { withBasePath } from "../_lib/basePath";

export default function LandingExperience() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace(withBasePath("/"));
    }
  }, []);

  return null;
}
