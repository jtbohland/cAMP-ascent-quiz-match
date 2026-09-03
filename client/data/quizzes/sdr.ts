import type { Quiz } from "../quiz-types.js";

/**
 * SDR-exclusive quiz: Cold Calling + Nooks
 * Sources: "Cold Calling in an AI World" training (Julia/Giulio),
 *          Nooks platform onboarding, Outreach → Nooks walkthrough.
 */
export const sdrQuizzes: Quiz[] = [
  {
    id: "sdr-cold-calling",
    day: "SDR 5",
    title: "Cold Calling + Nooks",
    week: "Week 3",
    questions: [
      {
        id: 1, type: "mc", lo: "LO1",
        text: "The cold calling training explains that fear of cold calling is rooted in evolutionary psychology. Which statement best captures why social rejection feels so painful?",
        options: [
          "Sales training historically uses negative reinforcement, conditioning reps to associate calls with failure",
          "Humans evolved in tribes where social rejection meant death — our brains still treat 'no' as a survival threat",
          "Cold calling triggers cortisol spikes identical to physical danger, which modern neuroscience has linked to phone anxiety",
          "Most reps lack proper training, so the fear comes from incompetence rather than biology",
        ],
        correct: 1,
        explanation: "The trainer explains that humans evolved as tribal animals — if you were socially rejected, your DNA wouldn't have survived the cycle. Our brains haven't evolved past this wiring. That's why a 'no' on a cold call can feel disproportionately painful. The key takeaway: fear of rejection is completely normal and biologically hardwired. You can't eliminate it, but you can build habits, practice, and gamify it to act despite the fear.",
        resource: { label: "Cold Calling in an AI World — Why We Fear Rejection", url: "https://docs.google.com/presentation/d/cold-calling-ai-world" },
      },
      {
        id: 2, type: "mc", lo: "LO1",
        text: "According to the cold calling training, 'reactance theory' describes a powerful human instinct. What does this theory say, and how should it shape your opener?",
        options: [
          "People buy fastest under time pressure — your opener should create urgency so they don't have time to think about hanging up",
          "When someone feels their freedom is being restricted, they fight back hard — so your opener should make the prospect feel in control, even if you plan to re-engage after a 'no'",
          "Prospects mirror the emotional state of the caller — your opener should project extreme enthusiasm to transfer positive energy",
          "People respond best to authority figures — your opener should lead with credentials and social proof to earn immediate respect",
        ],
        correct: 1,
        explanation: "Reactance theory means humans will fight — even die — to protect their freedom. On a cold call, if the prospect feels you're restricting their choice (pitching without permission, not giving them an out), they'll push back hard. The training's approach: give them a clear out ('if it's not relevant, I'll hang up myself') so they feel in control. Paradoxically, giving them the freedom to say no makes them more likely to say yes and keep listening.",
        resource: { label: "Cold Calling in an AI World — Reactance Theory & Permission", url: "https://docs.google.com/presentation/d/cold-calling-ai-world" },
      },
      {
        id: 3, type: "fill", lo: "LO1",
        text: "The cold calling training is structured around three P's: Psychology, Process, and ________.",
        correct: ["Personality", "personality"],
        placeholder: "third P...",
        explanation: "The three P's framework organizes the entire cold calling methodology: Psychology (understanding why fear exists and how prospects think), Process (the repeatable steps — opener, pitch, objection handling), and Personality (making it fun, gamifying rejection, building streaks, and not sounding like every other salesperson). The trainer emphasizes that personality is what differentiates you — you don't need to be weird, but you do need to not sound like the other nine out of ten callers.",
        resource: { label: "Cold Calling in an AI World — The Three P's Framework", url: "https://docs.google.com/presentation/d/cold-calling-ai-world" },
      },
      {
        id: 4, type: "mc", lo: "LO2",
        text: "The trainer's recommended opener for targeted prospects is: \"Good morning, [Name]. I'm hoping you can help me. You're one of [number] [title]s in [industry/region] that we'd love to have as clients. Can you help me understand if it's relevant?\" Why is this opener effective?",
        options: [
          "It uses an open-ended question that forces the prospect into a longer conversation before they can hang up",
          "It asks for help twice, makes the call specific and clearly not spam, flatters the prospect, and keeps cognitive load low with a simple yes/no close",
          "It avoids mentioning sales entirely, so the prospect doesn't realize it's a cold call until they're already engaged",
          "It uses urgency by implying limited spots, creating FOMO that compels the prospect to stay on the line",
        ],
        correct: 1,
        explanation: "This opener packs multiple psychological triggers into a natural-sounding sentence: (1) 'I'm hoping you can help me' — triggers the human instinct to help, (2) 'You're one of twelve CFOs in tech' — makes it specific (clearly not a spam call about electricity), (3) 'we'd love to have as clients' — flattery, (4) 'Can you help me understand if it's relevant?' — asks for help again, closes with a low-effort yes/no that starts a permission chain. The trainer says if you don't know where to start, this is the one to use.",
        resource: { label: "Cold Calling in an AI World — Opener Examples", url: "https://docs.google.com/presentation/d/cold-calling-ai-world" },
      },
      {
        id: 5, type: "tf", lo: "LO1",
        text: "True or False: Nooks replaces Outreach as your primary prospecting and sequencing tool.",
        options: ["True", "False"],
        correct: 1,
        explanation: "False. Nooks works alongside Outreach, not as a replacement. You still do all prospecting, sequencing, adding new prospects to cadences, emailing, and LinkedIn steps in Outreach. Nooks handles the calling piece — when an Outreach sequence reaches a call task step, those prospects appear in Nooks. After you call and disposition in Nooks, that data syncs back to Outreach and triggers the next automation step in the sequence.",
        resource: { label: "Nooks Training — How Nooks Works in Your Tech Stack", url: "https://docs.google.com/presentation/d/nooks-onboarding" },
      },
      {
        id: 6, type: "mc", lo: "LO2",
        text: "In Nooks, parallel dialing calls 2–5 numbers concurrently. When should you switch to power dialing (one number at a time) instead?",
        options: [
          "Always — parallel dialing is only useful for teams with 10+ SDRs calling at the same time",
          "When calling a high-intent list, handling callbacks, or navigating dial trees where you want personalized voicemails and need to be ready for each connect",
          "When your connect rate drops below 5% — power dialing forces Nooks to try harder on each number",
          "Never — parallel dialing is strictly better in all scenarios and power dialing is a legacy feature",
        ],
        correct: 1,
        explanation: "Power dialing (one at a time) makes sense in specific situations: (1) High-intent lists where you have specific things to say to each prospect, (2) Callbacks — calling people back one at a time makes sense, (3) Hot Numbers lists — these people actually pick up sales calls, so you want to be ready, (4) Dial trees — numbers that require manual navigation (e.g., 'press 6 for the directory') that Nooks can't auto-navigate. For general prospecting and volume, parallel dialing (2–5x concurrently) is the way to go.",
        resource: { label: "Nooks Training — Power vs. Parallel Dialing", url: "https://docs.google.com/presentation/d/nooks-onboarding" },
      },
      {
        id: 7, type: "fill", lo: "LO1",
        text: "Each rep can create up to ________ phone numbers in Nooks, and should rotate numbers every couple of days to reduce spam risk.",
        correct: ["10", "ten", "10 phone numbers", "ten phone numbers"],
        placeholder: "how many numbers...",
        explanation: "Each rep can have up to 10 phone numbers at any given time within Nooks. You choose area codes — major metros in your territory are recommended. Rotating your primary number every couple of days is one of the key best practices for keeping spam risk low. If a number gets flagged as 'likely spam,' delete it and create a new one. Numbers with a black check mark are registered with Amplitude and safe to use; yellow warning means registration is pending.",
        resource: { label: "Nooks Training — Phone Number Management & Spam Prevention", url: "https://docs.google.com/presentation/d/nooks-onboarding" },
      },
      {
        id: 8, type: "match", lo: "LO2",
        text: "Match each Nooks feature to what it does.",
        pairs: [
          { term: "Smart Presence", match: "Auto-selects the phone number most likely to get each prospect to pick up" },
          { term: "Hot Numbers", match: "Identifies numbers that answer sales calls at a much higher rate than average" },
          { term: "Voicemail Drop", match: "Pre-records voicemails that can be assigned per sequence step" },
          { term: "Chrome Extension", match: "Pulls LinkedIn and Outreach prospect/account notes into Nooks" },
        ],
        correct: 0,
        explanation: "Smart Presence uses historical data across all of Nooks to determine which of your phone numbers has the highest likelihood of getting a specific prospect to pick up — it's not local presence (mimicking area codes), it's data-driven number selection. Hot Numbers flags prospects who pick up sales calls at a high rate across all Nooks users — great for power dialing. Voicemail Drop lets you pre-record voicemails and assign them to specific sequence steps (tip: reference your next digital touch in the VM). The Chrome Extension grabs LinkedIn profiles and Outreach notes so you get full context during calls.",
        resource: { label: "Nooks Training — Features Overview", url: "https://docs.google.com/presentation/d/nooks-onboarding" },
      },
      {
        id: 9, type: "mc", lo: "LO2",
        text: "You use the recommended opener and the prospect says, \"Not interested. I'm in a meeting.\" According to the cold calling training, what's the best way to re-engage?",
        options: [
          "Apologize and ask when would be a better time to call back",
          "Acknowledge it with humor — \"Is that because you hate cold calls, or just me?\" — then follow up with \"What about the good ones?\"",
          "Ignore the objection and go straight into your pitch — speed is everything on a cold call",
          "Thank them for their time and hang up immediately — respecting the 'no' builds long-term trust for future outreach",
        ],
        correct: 1,
        explanation: "The trainer demonstrates this 'one-two' re-engagement technique with a real call recording. After the prospect says no: (1) Ask something deeply human — 'Is that because you hate cold calls, or just me?' — which breaks the script in their head, gets a laugh or honest response, then (2) follow with 'What about the good ones?' The trainer says you can turn about half of initial 'no's' into conversations using this approach. It works because you're being a real person, not a robot reading a script.",
        resource: { label: "Cold Calling in an AI World — Handling the 'No' After the Opener", url: "https://docs.google.com/presentation/d/cold-calling-ai-world" },
      },
      {
        id: 10, type: "mc", lo: "LO1",
        text: "When an Outreach sequence reaches a call task step, what happens in Nooks?",
        options: [
          "Nooks automatically dials the prospect without any rep action required",
          "The prospect's call task appears in Nooks — the rep selects the sequence, then clicks 'Start Calling' to begin dialing",
          "Nooks sends the prospect an automated voicemail and moves to the next sequence step",
          "The rep must manually copy the prospect's phone number from Outreach and paste it into the Nooks dialer",
        ],
        correct: 1,
        explanation: "When prospects in an Outreach sequence hit a call task step, those tasks automatically populate in Nooks. The rep opens Nooks, selects the sequence from the sequence selector, and the due call tasks appear as a list. From there, the rep clicks 'Start Calling' to begin the session. After each call, the disposition selected in Nooks (e.g., 'no answer — follow up with email') logs back to Outreach automatically, including any notes. This keeps the prospect moving through the sequence without manual Outreach updates.",
        resource: { label: "Outreach → Nooks Workflow Walkthrough", url: "https://docs.google.com/presentation/d/outreach-nooks-workflow" },
      },
    ],
  },
];
