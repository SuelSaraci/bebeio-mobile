type MessageCategory =
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'evening'
  | 'vaccine'
  | 'appointment';

const FEEDING_MESSAGES = [
  (name: string) => ({
    title: 'Time for a snack? 🍼',
    body: `${name} might be ready for a feed — your future self will thank you for logging it.`,
  }),
  (name: string) => ({
    title: 'Hungry little one?',
    body: `If ${name}'s doing the "I'm starving" dance, it's a great time to log a feeding.`,
  }),
  (name: string) => ({
    title: 'Feeding check-in',
    body: `Tiny humans eat surprisingly often. How's ${name} doing?`,
  }),
  (name: string) => ({
    title: 'Milk o\'clock ☕️',
    body: `Just a friendly nudge: log ${name}'s feeding before you forget and wonder "wait… when?"`,
  }),
  (name: string) => ({
    title: 'You\'re doing great 💪',
    body: `Another feeding, another win. Tap to log ${name}'s meal.`,
  }),
  (name: string) => ({
    title: 'Bottle service 🍼',
    body: `${name}'s personal chef (that's you) is on duty. Log the latest serving?`,
  }),
  (name: string) => ({
    title: 'Tummy time… for the tummy',
    body: `Rumble in the jungle? ${name} might be ready for a feed.`,
  }),
  (name: string) => ({
    title: 'Snack attack incoming',
    body: `Babies run on milk and chaos. Log ${name}'s feeding while it's fresh.`,
  }),
  (name: string) => ({
    title: 'Chef\'s kiss 👩‍🍳',
    body: `You + ${name} = dream team. Quick log before the next adventure begins.`,
  }),
  (name: string) => ({
    title: 'Is it brunch o\'clock?',
    body: `${name} doesn't know what day it is, but might know it's feeding time.`,
  }),
  (name: string) => ({
    title: 'Fuel up ⛽️',
    body: `Little engines need refueling. How's ${name}'s last meal looking?`,
  }),
  (name: string) => ({
    title: 'The hunger games',
    body: `Spoiler: ${name} always wins. Log the feeding and claim victory.`,
  }),
  (name: string) => ({
    title: 'Midnight snack? 🌙',
    body: `Evening feeds count too. ${name}'s growing while you rock this parenting thing.`,
  }),
  (name: string) => ({
    title: 'Mama radar 📡',
    body: `Trust your instincts — and log ${name}'s feed so your brain can rest.`,
  }),
  (name: string) => ({
    title: 'Open 24/7',
    body: `${name}'s favorite restaurant is you. Log today's special?`,
  }),
];

const DIAPER_MESSAGES = [
  (name: string) => ({
    title: 'Diaper patrol 👀',
    body: `Quick check: has ${name}'s outfit been… upgraded recently? Log a diaper change.`,
  }),
  (name: string) => ({
    title: 'Sniff test time',
    body: `We won't judge — but ${name}'s diaper might have opinions. Worth a check!`,
  }),
  (name: string) => ({
    title: 'Fresh & dry',
    body: `Happy baby, happy life. Log ${name}'s diaper when you get a sec.`,
  }),
  (name: string) => ({
    title: 'Plot twist: it\'s diaper time',
    body: `${name} is too cute for surprises. Log that change before the surprise finds you.`,
  }),
  (name: string) => ({
    title: 'Tiny but mighty 💨',
    body: `Diaper logged = one less thing on your mind. How's ${name} doing?`,
  }),
  (name: string) => ({
    title: 'Diaper detective 🕵️',
    body: `Case file: ${name}. Status: possibly due for a change. Investigate now.`,
  }),
  (name: string) => ({
    title: 'Code brown? Maybe.',
    body: `No alarm bells — just a gentle reminder to check ${name}'s diaper.`,
  }),
  (name: string) => ({
    title: 'Dry bum club',
    body: `${name} deserves VIP comfort. Log a change if it's been a while.`,
  }),
  (name: string) => ({
    title: 'Outfit upgrade available',
    body: `From "cute" to "fresh" in one tap. Check ${name}'s diaper?`,
  }),
  (name: string) => ({
    title: 'Nose knows 👃',
    body: `Your superpower is noticing things. ${name}'s diaper — worth a peek.`,
  }),
  (name: string) => ({
    title: 'Baby spa moment',
    body: `Clean diaper = happy ${name}. You already know the drill.`,
  }),
  (name: string) => ({
    title: 'Surprise prevention unit',
    body: `Stay one step ahead of ${name}'s surprises. Log that change.`,
  }),
  (name: string) => ({
    title: 'Squish check',
    body: `The squish test never lies. How's ${name} feeling down there?`,
  }),
  (name: string) => ({
    title: 'Fresh start ✨',
    body: `A new diaper is basically a reset button. ${name} approves.`,
  }),
  (name: string) => ({
    title: 'Parent pro tip',
    body: `Log ${name}'s diaper now — future you at 2 AM will be grateful.`,
  }),
];

const SLEEP_MESSAGES = [
  (name: string) => ({
    title: 'Nap time vibes 😴',
    body: `${name} might be ready for a little snooze — sleepy babies grow while they dream.`,
  }),
  (name: string) => ({
    title: 'Eyes getting heavy?',
    body: `If ${name}'s doing the slow blink, a nap could be magic. Log sleep when they drift off.`,
  }),
  (name: string) => ({
    title: 'Rest is a superpower',
    body: `Even super-parents need nap breaks. Track ${name}'s sleep when you can.`,
  }),
  (name: string) => ({
    title: 'Shhh… nap incoming',
    body: `A well-timed nap can turn chaos into calm. How long has ${name} been awake?`,
  }),
  (name: string) => ({
    title: 'Sleep = growth 📈',
    body: `Log ${name}'s nap or bedtime — you'll love seeing the patterns later.`,
  }),
];

const EVENING_MESSAGES = [
  (name: string) => ({
    title: 'Evening wind-down 🌙',
    body: `Before you crash: log ${name}'s sleep, diapers, or feedings from today.`,
  }),
  (name: string) => ({
    title: 'Day recap time',
    body: `You survived another day with ${name}. Quick log while it's still fresh in your mind.`,
  }),
  (name: string) => ({
    title: 'Almost bedtime',
    body: `Future you wants today's data. 30 seconds now = fewer "when did we…?" moments later.`,
  }),
  (name: string) => ({
    title: 'You\'re amazing ✨',
    body: `End the day with a quick check-in for ${name}. You've got this.`,
  }),
];

const VACCINE_MESSAGES = [
  (name: string, detail: string) => ({
    title: 'Vaccine day coming up 💉',
    body: `${name}'s ${detail} is on the calendar — you've got this, super-parent.`,
  }),
  (name: string, detail: string) => ({
    title: 'Health reminder',
    body: `Heads up: ${detail} for ${name}. A quick poke today, protection for tomorrow.`,
  }),
];

const APPOINTMENT_MESSAGES = [
  (name: string, detail: string) => ({
    title: 'Doctor visit soon 🩺',
    body: `${detail} for ${name} — pack the diaper bag and maybe a snack for you.`,
  }),
  (name: string, detail: string) => ({
    title: 'Appointment reminder',
    body: `${detail}. You're doing an awesome job keeping ${name} healthy.`,
  }),
];

function pickIndex(poolSize: number, salt = 0): number {
  const day = new Date().getDate();
  const month = new Date().getMonth();
  return (day * 31 + month * 7 + salt) % poolSize;
}

export function pickNotificationMessage(
  category: MessageCategory,
  babyName: string,
  detail?: string,
  salt = 0,
): { title: string; body: string } {
  switch (category) {
    case 'feeding': {
      const pool = FEEDING_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName);
    }
    case 'diaper': {
      const pool = DIAPER_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName);
    }
    case 'sleep': {
      const pool = SLEEP_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName);
    }
    case 'evening': {
      const pool = EVENING_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName);
    }
    case 'vaccine': {
      const pool = VACCINE_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName, detail ?? 'vaccination');
    }
    case 'appointment': {
      const pool = APPOINTMENT_MESSAGES;
      return pool[pickIndex(pool.length, salt)](babyName, detail ?? 'appointment');
    }
    default:
      return { title: 'Bebio reminder', body: `Check in on ${babyName}.` };
  }
}
