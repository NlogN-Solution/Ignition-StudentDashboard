import { apiGet } from "./client";

/**
 * The personalised half of Explore.
 *
 * Sections come from the server because the reasoning has to sit next to the
 * query that produced it — a client that built "Because you're interested in
 * Computing" from its own guess at the student's subject would eventually
 * label a row with a reason the rows do not satisfy.
 */

export const getExploreFeed = async () => {
  const data = await apiGet("/student/me/explore/feed");
  return data.sections ?? [];
};

export const getSimilarCourses = async (programId) => {
  if (!programId) return [];
  try {
    return await apiGet(`/student/me/explore/similar/${programId}`);
  } catch {
    // A missing "you may also like" row is not worth an error state.
    return [];
  }
};
