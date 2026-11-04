export type ImpactGate = {at: number; priority: number};
export function impactPriority(name: string) {
  return name === 'protected' ? 5 : name === 'rare' ? 4 : name === 'heavy' ? 3 :
    name === 'chip' ? 2 : name === 'hit' || name.startsWith('hit') ? 1 : 0;
}
// A school gets one cue per 90ms, while allowing a stronger hit to upgrade the feedback immediately.
export function nextImpactGate(previous: ImpactGate, now: number, priority: number): ImpactGate|null {
  if(now - previous.at < 90 && priority <= previous.priority) return null;
  return {at:now,priority};
}
