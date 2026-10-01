/**
 * Hands files picked elsewhere (Home, a task's "Upload" button) to the
 * "Add data" page across a client-side navigation. Lives in memory only:
 * a reload drops it, which is fine because nothing has been read yet.
 */

export interface PendingFile {
  file: File;
  /** The waiting task this upload answers, closed once the document is kept. */
  taskId?: number;
}

let queue: PendingFile[] = [];

export function stashFiles(files: PendingFile[]) {
  queue = [...queue, ...files].slice(0, 10);
}

export function takeStashedFiles(): PendingFile[] {
  const out = queue;
  queue = [];
  return out;
}

export const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,application/pdf,image/png,image/jpeg,image/webp,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
