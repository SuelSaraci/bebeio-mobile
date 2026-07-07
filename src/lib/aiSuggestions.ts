export function buildAiSuggestions(babyName: string): string[] {
  const name = babyName.trim() || 'my baby';
  return [
    `Is ${name} sleeping enough?`,
    `How is ${name}'s feeding schedule?`,
    `What milestones should ${name} reach soon?`,
    `When are ${name}'s vaccinations due?`,
    `How is ${name}'s growth progressing?`,
  ];
}
