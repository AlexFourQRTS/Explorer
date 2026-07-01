const GAIN_MULTIPLIER_OVER_1 = 3;

export function getGainScaledValue(value: number): number {
  if (value <= 1) {
    return value;
  }
  return (value - 1) * GAIN_MULTIPLIER_OVER_1 + 1;
}
