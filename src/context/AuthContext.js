import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from "../api/auth";
import { clearTokens, getAccessToken } from "../api/client";
import { fetchMyProfile, updateMyProfile } from "../api/students";

// Session comes from the real Ignition backend (JWT, stored in localStorage)
// instead of a hardcoded students.json lookup. The exported shape of this
// context — user/studentId/isAuthenticated/login/logout/updateUser — is
// unchanged on purpose, so nothing that reads `useAuth()` elsewhere had to
// change.
//
// `studentId` is now the real authenticated user's id (a UUID string), not
// the demo fixture id "stu-001" — every other context keys its data off this.
const AuthContext = createContext(null);

// The onboarding wizard's `educationLevels` options (formOptions.json) don't
// share spelling with the backend's `InstitutionType` enum
// (bachelor/diploma/10+2/masters/phd/other) — this is the one place that gap
// is bridged. Unrecognised input maps to "other" rather than throwing, since
// the enum is a required field the first time a profile is created and a
// typo here must not block the whole wizard.
const INSTITUTION_TYPE_BY_LABEL = {
  "high school": "10+2",
  "bachelor's degree": "bachelor",
  "master's degree": "masters",
  phd: "phd",
  diploma: "diploma",
  other: "other",
};

const institutionTypeFor = (label) => {
  if (!label) return null;
  return INSTITUTION_TYPE_BY_LABEL[label.trim().toLowerCase()] || "other";
};

/** Maps the backend's User + StudentProfile shapes onto the camelCase shape
 * every existing screen (Dashboard, sidenav, profile pages) already reads.
 *
 * `counsellorId` has no equivalent on Ignition's `StudentProfile` — a
 * counsellor is assigned per `Application`, not once per student — so it
 * always reads null here. Nothing currently reads it; if a screen needs "my
 * counsellor" it should come from the student's applications instead.
 */
const toLegacyUser = (account, profile) => ({
  id: account.id,
  fullName: [account.first_name, account.last_name].filter(Boolean).join(" "),
  email: account.email,
  phone: account.phone,
  role: account.role,
  profileImage: account.avatar_url || null,
  counsellorId: null,
  basicInfo: {
    // date_of_birth/gender live on the account (User), not the profile —
    // Ignition ported them from ED360's user table, not the student-portal
    // extension.
    dateOfBirth: account.date_of_birth ?? "",
    gender: account.gender ?? "",
    nationality: profile?.nationality ?? "",
  },
  address: profile?.address ?? {},
  education: profile?.education ?? {},
  preferences: profile?.preferences ?? {},
  testScores: profile?.test_scores ?? {},
  profileCompletion: profile?.profile_completion ?? 0,
  onboardingCompleted: profile?.onboarding_completed ?? false,
});

const loadSession = async () => {
  const account = await fetchCurrentUser();
  // Only student accounts have a StudentProfile row — admin/counsellor/
  // super_admin logins would otherwise 404 this call every time. A student
  // who just registered and hasn't been through the onboarding wizard yet
  // also 404s here (no profile row exists until the first PATCH creates
  // one) — that must not fail the login/register call that got them here.
  let profile = null;
  if (account.role === "student") {
    try {
      profile = await fetchMyProfile();
    } catch {
      profile = null;
    }
  }
  return toLegacyUser(account, profile);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  // True until the initial "is there already a valid session?" check resolves,
  // so a page refresh doesn't flash a logged-out state before it's known.
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!getAccessToken()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const nextUser = await loadSession();
        if (!cancelled) setUser(nextUser);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsAuthenticating(true);
    try {
      await apiLogin(email, password);
      const nextUser = await loadSession();
      setUser(nextUser);
      return { ok: true, user: nextUser };
    } catch (error) {
      clearTokens();
      const message =
        error?.data?.detail || "Incorrect email or password.";
      return { ok: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  /** Kept separate from `login` — used by the registration screen. */
  const register = useCallback(async (payload) => {
    setIsAuthenticating(true);
    try {
      await apiRegister(payload);
      const nextUser = await loadSession();
      setUser(nextUser);
      return { ok: true, user: nextUser };
    } catch (error) {
      clearTokens();
      return { ok: false, error: error?.data };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiLogout().catch(() => {});
  }, []);

  /**
   * `education`/`preferences`/`testScores`/`address` and `basicInfo.nationality`
   * go to the student-profile endpoint and really do leave the browser now.
   *
   * Three things stay local-only, same posture as `profileImage` before it:
   * `fullName`/`email`/`phone` (no PATCH /auth/me exists — only staff can
   * edit another user's account fields) and `basicInfo.dateOfBirth`/`gender`
   * (those live on the account too, same gap). A form that edits them will
   * still look like it worked, it just won't survive a refresh — that's the
   * same trade `profileImage` already made.
   *
   * `education_level` is required by the backend the *first* time a profile
   * is created (`StudentProfileUpsert` 400s without it). The onboarding
   * wizard's `education.highestLevel` is the closest source for that, mapped
   * through `institutionTypeFor` below since the wizard's option labels
   * ("PhD", "High School") don't share spelling with the enum.
   */
  const updateUser = useCallback(async (patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));

    const { education, preferences, testScores, basicInfo, address, onboardingCompleted } = patch;

    const profilePatch = {};
    if (education !== undefined) {
      profilePatch.education = education;
      const educationLevel = institutionTypeFor(education?.highestLevel);
      if (educationLevel) profilePatch.education_level = educationLevel;
      // The profile page reads `graduation_year` as its own column, not out
      // of the `education` blob — the wizard's completion year is the only
      // thing in it that maps cleanly onto that column.
      const graduationYear = Number(education?.completionYear);
      if (Number.isInteger(graduationYear) && graduationYear > 0) {
        profilePatch.graduation_year = graduationYear;
      }
    }
    if (preferences !== undefined) {
      profilePatch.preferences = preferences;
      // Same story as `education` above — `preferred_country`/`preferred_program`
      // are the columns the profile page actually renders.
      if (preferences?.destinations !== undefined) {
        profilePatch.preferred_country = Array.isArray(preferences.destinations)
          ? preferences.destinations.join(", ") || null
          : preferences.destinations || null;
      }
      if (preferences?.intendedStudyArea !== undefined) {
        profilePatch.preferred_program = preferences.intendedStudyArea || null;
      }
    }
    if (testScores !== undefined) profilePatch.test_scores = testScores;
    if (address !== undefined) profilePatch.address = address;
    if (basicInfo?.nationality !== undefined) profilePatch.nationality = basicInfo.nationality;
    if (onboardingCompleted !== undefined) profilePatch.onboarding_completed = onboardingCompleted;

    if (Object.keys(profilePatch).length === 0) return;

    try {
      const profile = await updateMyProfile(profilePatch);
      setUser((current) => {
        if (!current) return current;
        return {
          ...current,
          basicInfo: { ...current.basicInfo, nationality: profile.nationality ?? "" },
          address: profile.address ?? {},
          education: profile.education ?? {},
          preferences: profile.preferences ?? {},
          testScores: profile.test_scores ?? {},
          profileCompletion: profile.profile_completion ?? current.profileCompletion,
          onboardingCompleted: profile.onboarding_completed ?? current.onboardingCompleted,
        };
      });
    } catch {
      // The optimistic local update above already reflects the intent; a
      // failed background sync isn't surfaced here — real form-level error
      // handling for profile edits is a later-phase concern.
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      studentId: user ? user.id : null,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      isBootstrapping,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isAuthenticating, isBootstrapping, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};

export default AuthContext;
