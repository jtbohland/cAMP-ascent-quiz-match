---
name: Deployed App Loading Issue
description: Diagnosis of why the deployed app shows 'Loading your trail...'
  indefinitely for some users (especially SMEs). Reference when debugging
  production loading issues or the CampLookupViewer API.
accessType: on_demand
isEnabled: true
createdAt: 2026-09-21T20:31:45.908Z
---

## Deployed App "Loading your trail..." Hang

**Symptom:** The deployed app at `*.deployed-apps.superblocks.com` gets stuck on the "Loading your trail..." screen for users who aren't registered campers (especially SMEs).

**Root cause (suspected):** Either `useSuperblocksUser()` doesn't resolve user data in the deployed app's auth flow, or the `CampLookupViewer` API hangs/fails in the production environment. Works fine in editor preview (dev data tag + builder session).

**Current workaround:** Added an "🦉 I'm an SME — here to audit quiz content" button directly on the loading screen. SMEs click it to bypass the loading gate and enter the audit flow immediately.

**To properly diagnose:**
1. Check deployed app API execution logs for `CampLookupViewer` — is it erroring, timing out, or never being called?
2. Verify `useSuperblocksUser()` returns user data after deployed app login
3. Check if the `production` data tag database connection is working

**Affected files:** `client/components/camp/RegistrationGate.tsx`
