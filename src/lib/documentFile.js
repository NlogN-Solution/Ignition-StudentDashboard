import { getDocumentBlob, getDocumentFileLink } from "../api/studentPortal";

/**
 * A blank tab to navigate once a signed URL arrives, or null if it was blocked.
 *
 * Opened synchronously, inside the click and before any await: opening it
 * after the round-trip is a popup the browser did not see the click for, and
 * Safari and Firefox block it.
 *
 * Deliberately NOT opened with the `noopener` feature. Every View and Download
 * used to be, and the HTML spec has `window.open` return `null` when
 * `noopener` is set — so an empty about:blank tab appeared that nothing could
 * navigate, and the fallback below sent the portal itself away to the file.
 * The opener link is cut by hand instead, which keeps the protection and the
 * handle.
 */
export const openBlankTab = () => {
  const tab = window.open("", "_blank");
  if (!tab) return null;
  try {
    tab.opener = null;
    tab.document.title = "Opening…";
    tab.document.body.innerHTML =
      '<p style="font:14px system-ui,sans-serif;color:#555;padding:24px">Opening your file…</p>';
  } catch {
    // Cosmetic only; the tab is still ours to navigate.
  }
  return tab;
};

/** Point a tab from `openBlankTab` at `url`, or this tab if the popup was blocked. */
export const navigateTab = (tab, url) => {
  if (tab && !tab.closed) {
    tab.location.href = url;
  } else {
    window.location.assign(url);
  }
};

/** How long a blob URL handed to a tab stays valid — long enough to load. */
const BLOB_URL_LIFETIME_MS = 60_000;

/**
 * Open a stored document in the browser.
 *
 * Every View/Download button in the portal goes through here, and none of them
 * may link straight at `document.fileUrl`. That field is the *authenticated*
 * route (`/api/v1/documents/{id}/download`): a tab opened at it, or an
 * `<a href>` clicked on it, carries no `Authorization` header and gets a 401.
 *
 * - **View** (`inline`) fetches the bytes over the authenticated client and
 *   opens a blob URL, so the browser's own viewer shows the file with its real
 *   type wherever it is stored.
 * - **Download** (`attachment`) opens the signed URL from `/link`, which
 *   Cloudinary serves as a named attachment.
 */
export const openDocumentFile = async (documentId, { disposition = "inline" } = {}) => {
  const target = openBlankTab();
  try {
    if (disposition === "attachment") {
      const { url } = await getDocumentFileLink(documentId, disposition);
      navigateTab(target, url);
    } else {
      const blob = await getDocumentBlob(documentId, "inline");
      const url = URL.createObjectURL(blob);
      navigateTab(target, url);
      setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_LIFETIME_MS);
    }
    return { ok: true };
  } catch (error) {
    target?.close();
    return { ok: false, error };
  }
};
