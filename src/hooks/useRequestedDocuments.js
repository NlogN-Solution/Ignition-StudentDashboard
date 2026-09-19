import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppData } from "../context/AppDataContext";
import { getApplicationChecklistApi, linkChecklistItemDocumentApi } from "../api/studentPortal";

/**
 * Everything staff have asked this student for, across every application.
 *
 * One hook because three screens need the same two things — the list, and the
 * upload-then-link sequence that answers an item — and that sequence is exactly
 * where the feature was broken. Uploading a file and linking it to the checklist
 * item are two calls, and if the second does not happen the item stays on
 * "Pending" no matter how many times the student uploads. It used to not happen:
 * `uploadDocument` returned `{ ok, document }` and every caller read `.id` off
 * that wrapper, so the PATCH carried `document_id: undefined`, JSON dropped the
 * key and the backend changed nothing. Having one implementation means there is
 * one place for that to be right.
 *
 * The list keeps *every* item, in every status. The Documents screen used to
 * filter it to `pending`/`rejected` on arrival, so an item vanished the moment
 * it was uploaded — the student got no confirmation that what they sent had
 * arrived, and never saw it turn verified. Callers group it themselves.
 */
export const useRequestedDocuments = () => {
  const { applications, uploadDocument } = useAppData();
  const [items, setItems] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  // Which set of applications `items` answers for. Until it matches the
  // current set, the list is stale or not fetched yet — and a caller that
  // treated that as "nothing requested" would render its empty state for a
  // frame before the real items landed.
  const [loadedFor, setLoadedFor] = useState(null);
  const [uploadingItemId, setUploadingItemId] = useState(null);

  // `applications` is a fresh array on every render of the provider; the ids
  // are what actually change, so they are the dependency.
  const applicationIds = applications.map((application) => application.id).join(",");

  const reload = useCallback(async () => {
    if (applications.length === 0) {
      setItems([]);
      setIsFetching(false);
      setLoadedFor(applicationIds);
      return [];
    }
    setIsFetching(true);
    const lists = await Promise.all(
      applications.map((application) =>
        getApplicationChecklistApi(application.id)
          .then((checklist) =>
            checklist.map((item) => ({ ...item, applicationName: application.universityName }))
          )
          .catch(() => [])
      )
    );
    const next = lists.flat();
    setItems(next);
    setIsFetching(false);
    setLoadedFor(applicationIds);
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationIds]);

  useEffect(() => {
    let cancelled = false;
    reload().catch(() => {
      if (!cancelled) {
        setIsFetching(false);
        setLoadedFor(applicationIds);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reload, applicationIds]);

  const isLoading = isFetching || loadedFor !== applicationIds;

  /** Answer one request: upload the file, then link it to the item that asked. */
  const fulfil = useCallback(
    async (item, file) => {
      setUploadingItemId(item.id);
      try {
        const uploaded = await uploadDocument(item.documentType || "other", file, {
          applicationId: item.applicationId,
        });
        const updated = await linkChecklistItemDocumentApi(item.applicationId, item.id, uploaded.id);
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, ...updated, applicationName: entry.applicationName } : entry
          )
        );
        return { ok: true, document: uploaded };
      } catch (error) {
        return { ok: false, error };
      } finally {
        setUploadingItemId(null);
      }
    },
    [uploadDocument]
  );

  const grouped = useMemo(
    () => ({
      /** The student owes these — nothing sent, or what was sent came back. */
      outstanding: items.filter((item) => item.status === "pending" || item.status === "rejected"),
      /** Sent, waiting on Ignition. */
      inFlight: items.filter((item) => item.status === "submitted"),
      /** Done, one way or the other. */
      settled: items.filter((item) => item.status === "verified" || item.status === "waived"),
    }),
    [items]
  );

  return { items, ...grouped, isLoading, uploadingItemId, fulfil, reload };
};
