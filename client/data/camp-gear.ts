/**
 * cAMP Gear — study resources for each quiz day.
 * Pulled from the Ascent Guide. Each session maps to its linked resources.
 */

export interface CampResource {
  type: string;
  emoji: string;
  label: string;
  url: string;
}

/** Badge color + label for each resource type */
export const RESOURCE_TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  slides:       { label: "Slides",       bg: "bg-blue-100",    text: "text-blue-700" },
  spekit:       { label: "Spekit",       bg: "bg-purple-100",  text: "text-purple-700" },
  doc:          { label: "Doc",          bg: "bg-green-100",   text: "text-green-700" },
  campClips:    { label: "cAMP Clips",   bg: "bg-emerald-100", text: "text-emerald-700" },
  zoom:         { label: "Zoom",         bg: "bg-yellow-100",  text: "text-yellow-700" },
  zoomPlaylist: { label: "Zoom",         bg: "bg-yellow-100",  text: "text-yellow-700" },
  dashboard:    { label: "Dashboard",    bg: "bg-indigo-100",  text: "text-indigo-700" },
  mindtickle:   { label: "MindTickle",   bg: "bg-pink-100",    text: "text-pink-700" },
  external:     { label: "External",     bg: "bg-slate-100",   text: "text-slate-600" },
  glean:        { label: "Glean",        bg: "bg-orange-100",  text: "text-orange-700" },
};

export const CAMP_GEAR: Record<string, CampResource[]> = {
  day1: [
    { type: "slides", emoji: "📓", label: "Understanding our Verticals Deck", url: "https://docs.google.com/presentation/d/18nXxc5Oi2RHfqYYrFCjhAh0k87m1Q63z9_TAx2nynfY/edit" },
    { type: "slides", emoji: "📓", label: "Understanding our Personas Deck", url: "https://docs.google.com/presentation/d/17ju4fk3qimE1JTdiz4vLu5yjnOWSYzpvtQcijul18uA/edit" },
    { type: "spekit", emoji: "🐙", label: "Industries Hub", url: "https://app.spekit.co/app/wiki/?&topic=0a75288e-bbe4-423c-ae30-fd5703b8ad43&tag=Industries" },
    { type: "spekit", emoji: "🐙", label: "Personas Hub", url: "https://app.spekit.co/app/wiki/?&topic=240af8a2-52c3-4f30-ad21-fdcab0c093fe&tag=Personas" },
    { type: "slides", emoji: "📓", label: "Value Drivers Deck", url: "https://docs.google.com/presentation/d/1ODJk8BUphrI5cgGSxxjj91xie0B9k2WiECGLnX9xwU0/edit?slide=id.g35ff5eb7153_0_0#slide=id.g35ff5eb7153_0_0" },
    { type: "doc", emoji: "📚", label: "Discovery Question Repository", url: "https://docs.google.com/document/d/11po0r9LxK_tiooyYb64bdDeqhIhRX_7k-HSlPppf1A4/edit?tab=t.5c34f94kg7l4" },
  ],
  day2: [
    { type: "slides", emoji: "📓", label: "TOFU Training Deck", url: "https://docs.google.com/presentation/d/1cFxBuOQyJxSEnN34JrolHsnzc2DhdgUX-bxtBM_xYDM/edit#slide=id.g1573d3db8dc_0_39" },
    { type: "slides", emoji: "📓", label: "Detailed Appendix", url: "https://docs.google.com/presentation/d/1ypASL0eeGp8uqrR00lMkN3eI2GHWUJcswfTQBYPSBE0/edit?usp=sharing" },
    { type: "doc", emoji: "📓", label: "TOFU FAQs", url: "https://docs.google.com/document/d/14QUw9j82ZGvfDZi7w7hTz44EWibz3DzQieaIbGzsGZY/edit?tab=t.0" },
    { type: "campClips", emoji: "🌲🍿", label: "1h 28m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "dashboard", emoji: "📊", label: "GTM Launch Pad Dashboard (Tableau — for TOFU demo)", url: "https://amplitude.lightning.force.com/analytics/dashboard/0FKUw0000000gLpOAI" },
    { type: "zoomPlaylist", emoji: "🍿", label: "TOFU Playlist: Quick Hit Clips — All 9 Scenarios", url: "https://amplitude.zoom.us/clips/share/play-list/a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Getting Started with List Views", url: "https://zoom.us/clips/share/g1fWy3eEQLuPLfelzLzlJQ?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "New MQL Layout", url: "https://zoom.us/clips/share/eiGboEkaS6uWX-5eFV08pA?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Velocity Leads", url: "https://zoom.us/clips/share/fq_JrLZvQiGsAM6D7d0QwA?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Breach Scenario", url: "https://zoom.us/clips/share/614Oh8oLQn-f7H3pLL9KKQ?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Auto-Accept Scenario", url: "https://zoom.us/clips/share/6NxcMoSzROG1F-DAVvcwzQ?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Disqualify Scenario", url: "https://zoom.us/clips/share/zHyx94ByTcOXmyJ_7aWDkA?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Manual Accept Scenario", url: "https://zoom.us/clips/share/M6qf48BTQX6EyYY5doDlWg?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "SAL to S0 to S1 Scenarios", url: "https://zoom.us/clips/share/5RW84KKzQqCPi5vadKUPmw?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "zoom", emoji: "🍿", label: "Reroute Scenario", url: "https://zoom.us/clips/share/vZmDRPvBQFefB8b8kz3BPQ?playlistId=a8fa9ac2312b412bbdc6e71651fb942c" },
    { type: "doc", emoji: "📚", label: "Setup Guide — How to Connect Slack to Salesforce", url: "https://docs.google.com/document/d/18K3NDmSAb5CjOfwsUIl5HeoZyimAqdMwH56nDIsQYaI/edit?tab=t.0" },
  ],
  day3: [
    { type: "slides", emoji: "📓", label: "GTM Launch Pad Deck", url: "https://docs.google.com/presentation/d/1tm_q5TJVRNYRrIB6wc5AGSmqTWyFDi3Na1EwO8tp80M/edit#slide=id.p1" },
    { type: "slides", emoji: "📓", label: "GTM Pod Tower Deck", url: "https://docs.google.com/presentation/d/1u1xTc696f36TSvKi7xJCvA5eDw043m0NHpyYCtkfnuQ/edit?slide=id.g3eff4aad3ea_0_283#slide=id.g3eff4aad3ea_0_283" },
    { type: "dashboard", emoji: "📊", label: "GTM Launch Pad (SFDC Dashboard)", url: "https://amplitude.lightning.force.com/analytics/dashboard/0FKUw0000000gLpOAI" },
    { type: "campClips", emoji: "🌲🍿", label: "1h", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
  ],
  day4: [
    { type: "doc", emoji: "📚", label: "ZoomInfo Handbook", url: "https://docs.google.com/document/d/1i_NmcVSWzjSAwPR3p8RpmC8JBklA6_NL64m73bjsm4o/edit?tab=t.0#heading=h.m0xn3vsp7na1" },
    { type: "slides", emoji: "📓", label: "Prospecting Process Deck", url: "https://docs.google.com/presentation/d/12u9LXd4vnyNQrv9d6hB2CjrppGNUYNpxCbFRnFKAJjw/edit?slide=id.g3804d1ab79e_0_158#slide=id.g3804d1ab79e_0_158" },
    { type: "zoom", emoji: "🍿", label: "High Intent Prospecting w/ List Views Demo (7m)", url: "https://amplitude.zoom.us/clips/share/hhl89hkIS9mg7v6SGRBpgg" },
    { type: "zoom", emoji: "🍿", label: "Prospecting into Land Accounts (15m)", url: "https://amplitude.zoom.us/clips/share/84UKexEKSKOtlEqzR6Gs2Q" },
    { type: "campClips", emoji: "🌲🍿", label: "53m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "slides", emoji: "📓", label: "Reachdesk: How to Use to Drive Pipeline", url: "https://docs.google.com/presentation/d/1pScrYlHft9xSNVfbytNvNpJaH0v-gM0W4tsWX_WKxKw/edit?slide=id.g34856135304_2_192#slide=id.g34856135304_2_192" },
    { type: "zoom", emoji: "🍿", label: "Reachdesk Session (44m)", url: "https://amplitude.zoom.us/clips/share/1HnN8co4TT-XfIREH0ZodQ?pageType=web" },
  ],
  day5: [
    { type: "spekit", emoji: "🐙", label: "Sales Operating Cadence & Manager Playbook (2026) — Renewals on pp. 10, 21, 27, 32, 33, 40", url: "https://docs.google.com/presentation/d/1CQLqFWy3M6JiprYlgNh8FelgJorPT-eZ_uvpg3F0IFE/edit?slide=id.ge0112cd95c_5_4#slide=id.ge0112cd95c_5_4" },
    { type: "spekit", emoji: "🐙", label: "2026 Sales Policy Handbook — Renewals on pp. 6, 7, 9, 22", url: "https://app.spekit.co/app/wiki/asset/817909a3-30d8-4b9b-9a35-d8c07150b365?type=asset&expanded=true" },
    { type: "doc", emoji: "📓", label: "Customer Engagement Model (CEM) — Renewal Motion (left panel)", url: "https://docs.google.com/document/d/1VxMWNbIWWEtJwuhNibKHUCsbOsCQqVFcin8vrZkeKZw/edit?tab=t.0#heading=h.k0bsvsa98x07" },
    { type: "spekit", emoji: "📓", label: "2026 Sales Finance & PPL Enablement Deck", url: "https://app.spekit.co/app/wiki/asset/101068d2-21c1-4d12-9f66-ab1f7fda4e8b?type=asset&expanded=true" },
    { type: "dashboard", emoji: "☁️", label: "Renewal Readiness Dashboard (SFDC)", url: "https://amplitude.lightning.force.com/analytics/dashboard/0FKUw0000000eOrOAI" },
  ],
  day6: [
    { type: "slides", emoji: "📓", label: "Competitive Landscape Deck", url: "https://docs.google.com/presentation/d/1ha9NRQs2GiT49ASGf7SiFKYTUcGIbgiveQ2HGhj0q00/edit?slide=id.p1#slide=id.p1" },
    { type: "spekit", emoji: "🐙", label: "Compete Hub (Adobe, Google, Heap, Mixpanel, In-House + more)", url: "https://app.spekit.co/app/wiki/?&topic=a63d9637-dfbc-4573-943d-d7b829870188&tag=Compete" },
    { type: "campClips", emoji: "🌲🍿", label: "1h 03m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "doc", emoji: "📚", label: "Discovery Question Repository", url: "https://docs.google.com/document/d/11po0r9LxK_tiooyYb64bdDeqhIhRX_7k-HSlPppf1A4/edit?tab=t.5c34f94kg7l4" },
  ],
  day7: [
    { type: "slides", emoji: "📓", label: "Account Planning Best Practices Deck", url: "https://docs.google.com/presentation/d/1E6CvN9brHBGNkS2SZcslVNmaRyaiJhtvw4_Jrq-dJ2c/edit?slide=id.g3d23c0d468d_0_0#slide=id.g3d23c0d468d_0_0" },
    { type: "campClips", emoji: "🌲🍿", label: "Account Planning (43m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "slides", emoji: "📓", label: "Momentum (for Slack) Deck", url: "https://docs.google.com/presentation/d/129YPTu9OKQYZM6fFIMxlsJOqalqUWcwlLvLnC4lOvXI/edit?slide=id.g3b9ad70583d_1_22#slide=id.g3b9ad70583d_1_22" },
    { type: "zoom", emoji: "🍿", label: "Integrating Momentum w/ Google Calendar (2m) — required", url: "https://drive.google.com/file/d/1RZpJouRFGPXXJ__JzQsbBbAXXwUZldyl/view" },
    { type: "campClips", emoji: "🌲🍿", label: "Momentum (18m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "doc", emoji: "📚", label: "Momentum FAQ (Confluence)", url: "https://amplitude.atlassian.net/wiki/spaces/BT/pages/3639705669/Momentum+FAQs" },
  ],
  day8: [
    { type: "doc", emoji: "📓", label: "Customer Engagement Model (CEM) — New Business Motion + Customer Journey Stages", url: "https://docs.google.com/document/d/1VxMWNbIWWEtJwuhNibKHUCsbOsCQqVFcin8vrZkeKZw/edit?tab=t.0#heading=h.k0bsvsa98x07" },
    { type: "campClips", emoji: "🌲🍿", label: "CEM New Business Motion (33m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "doc", emoji: "📚", label: "Discovery Question Repository", url: "https://docs.google.com/document/d/11po0r9LxK_tiooyYb64bdDeqhIhRX_7k-HSlPppf1A4/edit?tab=t.5c34f94kg7l4" },
    { type: "doc", emoji: "📚", label: "MEDDPICC: Discovery Discussion", url: "https://docs.google.com/document/d/1dT5RcrPrDxQnnCPjjPXdmQVEfNtvliE92etJHLKl20Y/edit#heading=h.p170dogliwg" },
    { type: "spekit", emoji: "📓", label: "How to Create Deal Rooms", url: "https://app.spekit.co/app/wiki/business_term/97c7a503-ee0e-4228-bd72-fa1116a6bfd3?type=business_term&expanded=true" },
    { type: "campClips", emoji: "🌲🍿", label: "Spekit Deal Rooms (50m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "glean", emoji: "🚀", label: "Discovery Question Analyzer", url: "https://app.glean.com/chat/agents/daf6cbe7a5f24d328097723e8ab1ca5d?qe=https%3A%2F%2Famplitude-be.glean.com" },
    { type: "glean", emoji: "🚀", label: "Discovery Question Generator", url: "https://app.glean.com/chat/agents/3b6434728f2448eb9711391807069c84?qe=https%3A%2F%2Famplitude-be.glean.com" },
  ],
  day9: [
    { type: "mindtickle", emoji: "🧠", label: "Introduction to New Pricing & Packaging (6 lessons, 55m)", url: "https://amplitude.mindtickle.com/new/ui/learner/training/files/2026021170074268112?loSeriesId=2026020954479627972&loModuleId=2026021077838173257" },
    { type: "spekit", emoji: "📓", label: "2026 Sales Finance & PPL Enablement Deck", url: "https://app.spekit.co/app/wiki/asset/101068d2-21c1-4d12-9f66-ab1f7fda4e8b?type=asset&expanded=true" },
    { type: "slides", emoji: "📓", label: "2026 Proposal Template", url: "https://docs.google.com/presentation/d/1jhDGkH9jdm1mYj1b179mAn6pkphmCiStresnsAvKtQs/edit?slide=id.g3ca72f6abd4_1_2017#slide=id.g3ca72f6abd4_1_2017" },
    { type: "slides", emoji: "📓", label: "Pricing Scenario Exercise (for AEs & Partners)", url: "https://docs.google.com/presentation/d/1U44Rs5ZGuNiORIzteK-W1n0EN3HPDvnXXEHMOLbemUc/edit?slide=id.g342929c60aa_0_229#slide=id.g342929c60aa_0_229" },
  ],
  day10: [
    { type: "slides", emoji: "📓", label: "Partnerships + Sales 2026", url: "https://docs.google.com/presentation/d/1rveB2VaUwFO2NDFagOFfSpuOCg6WUjs8_xqkN8xzc1w/edit?slide=id.g3977c0ae5fc_4_606#slide=id.g3977c0ae5fc_4_606" },
    { type: "slides", emoji: "📓", label: "PSP and Implementation Pitch Slides (2026)", url: "https://docs.google.com/presentation/d/1JJlncSiWqwnxVLbTuuZrpHIgeje0RkGQobWFqlrM_f4/edit?slide=id.g3c587841949_0_203#slide=id.g3c587841949_0_203" },
    { type: "campClips", emoji: "🌲🍿", label: "1h 14m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
  ],
  day11: [
    { type: "zoom", emoji: "🍿", label: "How to Access Outreach Opportunity View Templates", url: "https://amplitude.zoom.us/rec/share/nZ4egcmbLHoHequYQ2-mKe98veWQwf1Zt7wBjXmRgbTQeGb3kFxgsNJYDRmY1VKW.cYX_m_4ebLYpxZHU" },
    { type: "slides", emoji: "📓", label: "Forecasting Deck", url: "https://docs.google.com/presentation/d/19-B_1a-oBmuMoI_4lc1L5W1oiZZN6pXALYMZObBc9L8/edit#slide=id.g31d63b2593c_0_2235" },
    { type: "campClips", emoji: "🌲🍿", label: "Forecasting Overview (1h 11m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "slides", emoji: "📓", label: "Forecasting: Services Deck", url: "https://docs.google.com/presentation/d/1oWMrNqmsc4f0r4vtYmhYZCnppL1cwdIbskQcs_0COQo/edit?slide=id.g37344bdb593_0_9#slide=id.g37344bdb593_0_9" },
    { type: "campClips", emoji: "🌲🍿", label: "Introduction to Process (5m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
  ],
  day12: [
    { type: "spekit", emoji: "🐙", label: "Customer Stories Hub", url: "https://app.spekit.co/app/wiki/?&topic=d07076bf-9871-42fb-9d91-63b9e3166385&tag=Customer%20Stories" },
    { type: "campClips", emoji: "🌲🍿", label: "51m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "external", emoji: "📺", label: "YouTube — Amplitude Channel", url: "https://www.youtube.com/@Amplitude_HQ/featured" },
    { type: "external", emoji: "📺", label: "YouTube — Customer Stories Playlist", url: "https://youtube.com/playlist?list=PLTuo2iFAKrD9gahF4uD-mCMr3mbUT9UWM&si=W2DlCYXS6B2Zzckd" },
    { type: "zoom", emoji: "🍿", label: "PODcast — Chegg (NAMER, 6m)", url: "https://amplitude.zoom.us/clips/share/_YNgyrg-SqeIbQ2t1zxsKw" },
    { type: "zoom", emoji: "🍿", label: "PODcast — FOX Corp (NAMER, 19m)", url: "https://amplitude.zoom.us/clips/share/eWjq8c5RQXGYvdWqXUeDWg" },
    { type: "zoom", emoji: "🍿", label: "PODcast — Essent Win Story (EMEA, 15m)", url: "https://amplitude.zoom.us/clips/share/983B7Y28RqqiysZBQrxCKw" },
    { type: "zoom", emoji: "🍿", label: "PODcast — Orange Win Story (EMEA, 15m)", url: "https://amplitude.zoom.us/clips/share/XtSPAK_cQrevlm2BC83Y4A" },
  ],
  day13: [
    { type: "mindtickle", emoji: "🧠", label: "Legal 101 (pre-work, from Base cAMP)", url: "https://deeplinks.mindtickle.com/g3Nb9zOV7Kb" },
    { type: "mindtickle", emoji: "🧠", label: "Legal 201 (25m)", url: "https://lms.amplitude.com/new/ui/learner/training/programs/1811138233611482941?series=1811138233611482941" },
    { type: "slides", emoji: "📓", label: "CLM & Legal Edits Deck", url: "https://docs.google.com/presentation/d/1qlfiR7FE_tkMei8SNNktEAxv0YLausl_gBXxrEvTm54/edit?slide=id.p8#slide=id.p8" },
    { type: "campClips", emoji: "🌲🍿", label: "28m", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
  ],
  day14: [
    { type: "slides", emoji: "📓", label: "Deal Desk + CPQ Deck", url: "https://docs.google.com/presentation/d/1C6iLzRnoEpi0W-0--79GHUlaA9CYxgo3ENujCabfRDk/edit#slide=id.p2" },
    { type: "spekit", emoji: "📓", label: "2026 Sales Finance & PPL Enablement Deck (relevant to today)", url: "https://app.spekit.co/app/wiki/asset/101068d2-21c1-4d12-9f66-ab1f7fda4e8b?type=asset&expanded=true" },
    { type: "campClips", emoji: "🌲🍿", label: "Watch First!", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "mindtickle", emoji: "🧠", label: "Deal Desk Training for PPL 2026 (30m)", url: "https://lms.amplitude.com/new/ui/learner/training/programs/2043719217316580035/modules" },
    { type: "zoom", emoji: "🍿", label: "How to Create a Support Case (2m)", url: "https://amplitude.zoom.us/clips/share/WChttiMmQvaUH0nWpXzKxw" },
    { type: "zoom", emoji: "🍿", label: "Sales Stage 6.5 (5m)", url: "https://amplitude.zoom.us/clips/share/KIeN2E7PS62-kBU--pGQUg" },
  ],
  day15: [
    { type: "slides", emoji: "📓", label: "Leveraging SEs Deck", url: "https://docs.google.com/presentation/d/1kDmK2l_Ahv01UlrBDSWoPqhtT70dQTcBT2GJ6PoSZzA/edit?slide=id.g38893dd4b4f_0_1154#slide=id.g38893dd4b4f_0_1154" },
    { type: "doc", emoji: "📓", label: "Demo Practice Guide — Onboarding, Monetization, Personalization", url: "https://docs.google.com/document/d/1X6sHzyFKqt8PUjB0LiRN5teqPASX5R9UZmX7Lw9or7g/edit?tab=t.0" },
    { type: "doc", emoji: "📓", label: "Solutions Engineering Virtual Teams (SEVT)", url: "https://docs.google.com/document/d/1NTHBwn-dHfuBrpwVvOsI_SByb8rkZnKZwibOTWLdoHA/edit?tab=t.0#heading=h.7hk0tqb38blj" },
    { type: "campClips", emoji: "🌲🍿", label: "SE Partnership (1h 24m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
    { type: "mindtickle", emoji: "🧠", label: "Winning with Services (15m)", url: "https://lms.amplitude.com/new/ui/learner/update/1914790073227978349/consume?series=1914789530156290770" },
    { type: "spekit", emoji: "📓", label: "Why Sell Services Deck", url: "https://app.spekit.co/app/wiki/asset/8b062e6d-9345-4eba-a4fb-7df608ea7772?type=asset&expanded=true" },
    { type: "spekit", emoji: "📓", label: "Amplitude Services Catalog H1FY2025", url: "https://app.spekit.co/app/wiki/asset/6d435896-7966-44ad-a3d4-5d8e46ea8874?type=asset&expanded=true" },
    { type: "campClips", emoji: "🌲🍿", label: "Why Sell Services + Services Forecasting (43m)", url: "https://app.superblocks.com/code-mode/applications/fbc1d457-949d-4756-9cd4-ca723f3cb5ac" },
  ],
};
