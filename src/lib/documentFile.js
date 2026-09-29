import { getDocumentFileLink } from "../api/studentPortal";

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

/**
 * Open a stored document in the browser.
 *
 * Every View/Download button in the portal goes through here, and none of them
 * may link straight at `document.fileUrl`. That field is the *authenticated*
 * route (`/api/v1/documents/{id}/download`): a tab opened at it, or an
 * `<a href>` clicked on it, carries no `Authorization` header and gets a 401.
 *
 * So the signed URL is fetched over the authenticated XHR, where the token
 * lives, and *that* is what gets opened.
 */
export const openDocumentFile = async (documentId, { disposition = "inline" } = {}) => {
  const target = openBlankTab();
  try {
    const { url } = await getDocumentFileLink(documentId, disposition);
    navigateTab(target, url);
    return { ok: true };
  } catch (error) {
    target?.close();
    // The caller needs the status, not just "it failed": a 402 means "pay and
    // this works", which should open the unlock screen rather than an error
    // toast. `ApiError` carries it.
    return { ok: false, error };
  }
};
