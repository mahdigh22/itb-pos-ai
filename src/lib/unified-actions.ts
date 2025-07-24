// src/lib/dataActions.ts
import { dbQueue } from "./dexieOfflineQueue";
import {
  safeAdd,
  safeUpdate,
  safeDelete,
  SafeCancelOrderItem,
} from "./offlineSync";
import {
  serverAdd,
  serverUpdate,
  serverDelete,
  serverCancelOrderItem,
} from "./server-action";

// Detect if running on server
const isServer = typeof window === "undefined";
console.log("isserver", isServer);
export const unifiedAdd = async (path: string, data: any) => {
  return isServer ? serverAdd(path, data) : safeAdd(path, data);
};

export const unifiedUpdate = async (path: string, data: any) => {
  return isServer ? serverUpdate(path, data) : safeUpdate(path, data);
};

export const unifiedDelete = async (path: string) => {
  return isServer ? serverDelete(path) : safeDelete(path);
};
export async function unifiedCancelOrderItem(
  restaurantId: string,
  orderId: string,
  lineItemId: string
) {
  const serverResponse =
    isServer &&
    (await serverCancelOrderItem(restaurantId, orderId, lineItemId));
  const offlineResponse =
    !isServer && (await SafeCancelOrderItem(restaurantId, orderId, lineItemId));
  return isServer ? serverResponse : offlineResponse;
}
