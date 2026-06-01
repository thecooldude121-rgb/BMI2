// ─── Attachment Upload Service ────────────────────────────────────────────────
// Abstracts file upload so the UI never calls fetch/axios directly.
// Swap the implementation here when the backend upload API is ready —
// the AttachmentItem type and the component code stay unchanged.

export interface UploadResult {
  url: string;        // publicly accessible URL of the uploaded file
  storedName: string; // filename as stored on the server (may differ from original)
}

/**
 * Uploads a single file and returns its server URL.
 *
 * CURRENT: mock implementation — simulates network latency and returns a
 * placeholder URL. No real request is made.
 *
 * TODO: replace the mock body with a real API call:
 *
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   formData.append('module', 'deal');
 *   const res = await fetch('/api/v1/documents', {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
 *     body: formData,
 *   });
 *   if (!res.ok) throw new Error((await res.json()).message ?? 'Upload failed');
 *   const { data } = await res.json();
 *   return { url: data.file_url, storedName: data.name };
 *
 * The documents table (module='deal', record_id=dealId) links the file to
 * its deal after the deal is saved and the ID is available.
 */
export const uploadFile = async (file: File): Promise<UploadResult> => {
  // Simulate upload latency proportional to file size (50–1500 ms)
  const delay = Math.min(50 + file.size / 5000, 1500);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate an occasional upload error (5% of the time) for realistic UX testing
  if (Math.random() < 0.05) {
    throw new Error('Network error — please retry');
  }

  return {
    url: `https://mock-storage.bmicrm.dev/deals/${Date.now()}-${encodeURIComponent(file.name)}`,
    storedName: file.name,
  };
};
