import { getDocumentFileLink } from "../api/studentPortal";

/**
 * Open a stored document in the browser.
 *
 * Every View/Download button in the portal goes through here, and none of them
 * may link straight at `document.fileUrl`. That field is the *authenticated*
 * route (`/api/v1/documents/{id}/download`): a tab opened at it, or an
 * `<a href>` clicked on it, carries no `Authorization` header and gets a 401.
 * Before this existed the Documents screen dodged the problem by not opening
 * anything at all — Preview drew a placeholder that said "preview is simulated
 * in this build", and Download raised a toast describing the file it would have
 * given you. The files were real the whole time; only the link was missing.
 *
 * So the signed URL is fetched over the authenticated XHR, where the token
 * lives, and *that* is what gets opened.
 *
 * The window is opened synchronously, before the await, and navigated once the
 * URL arrives. Opening it after the round-trip is a popup the browser did not
 * see the click for, and Safari and Firefox block it.
 */
export const openDocumentFile = async (documentId, { disposition = "inline" } = {}) => {
  const target = window.open("", "_blank", "noopener,noreferrer");
  try {
    const { url } = await getDocumentFileLink(documentId, disposition);
    if (target) {
      target.location = url;
    } else {
      // Popup blocked despite the synchronous open — fall back to this tab.
      window.location.assign(url);
    }
    return { ok: true };
  } catch (error) {
    target?.close();
    // The caller needs the status, not just "it failed": a 402 means "pay and
    // this works", which should open the unlock screen rather than an error
    // toast. `ApiError` carries it.
    return { ok: false, error };
  }
};
