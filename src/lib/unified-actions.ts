// src/lib/dataActions.ts
import { safeAdd, safeUpdate, safeDelete } from './offlineSync';
import { serverAdd, serverUpdate, serverDelete } from './server-action';

// Detect if running on server
const isServer = typeof window === 'undefined';

export const unifiedAdd = async (path: string, data: any) => {
  return isServer 
    ? serverAdd(path, data) 
    : safeAdd(path, data);
};

export const unifiedUpdate = async (path: string, data: any) => {
  return isServer 
    ? serverUpdate(path, data) 
    : safeUpdate(path, data);
};

export const unifiedDelete = async (path: string) => {
  return isServer 
    ? serverDelete(path) 
    : safeDelete(path);
};