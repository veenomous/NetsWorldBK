// Simplified NBA CBA trade salary matching rules
// Not full CBA compliance — approximate for fan engagement

export function checkTradeValidity(
  outgoing: number,
  incoming: number
): { valid: boolean; message: string } {
  if (outgoing === 0 || incoming === 0) {
    return { valid: false, message: "Select players on both sides" };
  }

  let maxIncoming: number;

  if (outgoing <= 7500000) {
    maxIncoming = 7500000 + outgoing;
  } else {
    maxIncoming = outgoing * 1.25 + 250000;
  }

  if (incoming <= maxIncoming) {
    const diff = Math.abs(outgoing - incoming);
    if (diff < 1000000) {
      return { valid: true, message: "Salaries match perfectly" };
    }
    return { valid: true, message: "Trade works under NBA salary rules" };
  }

  const over = incoming - maxIncoming;
  return {
    valid: false,
    message: `Over by ${formatM(over)} — need to send more salary out`,
  };
}

function formatM(n: number): string {
  return `$${(n / 1000000).toFixed(1)}M`;
}
