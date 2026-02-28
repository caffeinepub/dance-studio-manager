import { HttpAgent } from "@icp-sdk/core/agent";
import { loadConfig } from "../config";
import { StorageClient } from "./StorageClient";

let clientPromise: Promise<StorageClient> | null = null;

/**
 * Returns a singleton StorageClient for direct (non-Motoko) file uploads.
 * Uses the same config values as createActorWithConfig but with an anonymous agent.
 */
export async function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({
        host: config.backend_host,
      });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {
          /* ignore */
        });
      }
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    })();
  }
  return clientPromise;
}
