import type { AnnotationRecord, ExportJobRecord, ShareLinkRecord, SharedResourceRecord } from "../types";
import { requestJsonWithToken, type WorkerRequest } from "../platform/workerApi";
const requestJson: WorkerRequest = requestJsonWithToken;

export async function fetchAnnotations(
  termSlug: string,
  apiRequest: WorkerRequest = requestJson,
): Promise<AnnotationRecord[]> {
  const payload = await apiRequest<{ annotations: AnnotationRecord[] }>(
    `/api/annotations?termSlug=${encodeURIComponent(termSlug)}`,
  );
  return payload.annotations;
}

export async function saveAnnotation(input: {
  annotationId?: string | null;
  termSlug: string;
  blockId: string;
  selectedText?: string | null;
  noteBody?: string | null;
}, apiRequest: WorkerRequest = requestJson): Promise<string> {
  const payload = await apiRequest<{ annotationId: string }>("/api/annotations", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return payload.annotationId;
}

export async function removeAnnotation(
  annotationId: string,
  apiRequest: WorkerRequest = requestJson,
): Promise<void> {
  await apiRequest("/api/annotations", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ annotationId }),
  });
}

export async function createRemoteShareLink(input: {
  resourceType: string;
  resourceId: string;
  visibility?: string;
}, apiRequest: WorkerRequest = requestJson): Promise<ShareLinkRecord> {
  const payload = await apiRequest<{ shareLink: ShareLinkRecord }>("/api/share-links", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return payload.shareLink;
}

export async function fetchExportJobs(apiRequest: WorkerRequest = requestJson): Promise<ExportJobRecord[]> {
  const payload = await apiRequest<{ exportJobs: ExportJobRecord[] }>("/api/exports");
  return payload.exportJobs;
}

export async function requestRemoteExport(apiRequest: WorkerRequest = requestJson): Promise<{
  exportJob: ExportJobRecord;
  payload: unknown;
}> {
  return apiRequest("/api/exports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ exportType: "study-json" }),
  });
}

export async function fetchSharedResource(
  token: string,
  apiRequest: WorkerRequest = requestJson,
): Promise<SharedResourceRecord> {
  const payload = await apiRequest<{ shared: SharedResourceRecord }>(
    `/api/shared/${encodeURIComponent(token)}`,
  );
  return payload.shared;
}
