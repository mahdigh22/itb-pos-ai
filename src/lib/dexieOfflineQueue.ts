// src/lib/dexieOfflineQueue.ts

import Dexie, { Table } from "dexie";

export interface OfflineMutation {
  id: string;
  type: "add" | "update" | "delete" | "transaction" | "cancelOrderItem"; // Add 'cancelOrderItem' for order cancellation
  path: string; // Firebase path like restaurants/{id}/orders/{id}
  data: any;
  timestamp: number;
}

class OfflineQueueDB extends Dexie {
  mutations!: Table<OfflineMutation, string>;

  constructor() {
    super("OfflineQueueDB");
    this.version(1).stores({
      mutations: "id, type, path, timestamp",
    });
  }
}

export const dbQueue = new OfflineQueueDB();
