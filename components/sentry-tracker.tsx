"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "./ui/button";

export default function SentryTracker() {
  return (
    <div className="flex items-center gap-4">
      <Button
        type="button"
        onClick={() => {
          throw new Error("Sentry Test Error!");
        }}
      >
        Error Test
      </Button>
      <Button
        type="button"
        onClick={() => {
          Sentry.logger.info("User triggered test log", {
            log_source: "sentry_test",
          });
        }}
      >
        Log Test
      </Button>
    </div>
  );
}
