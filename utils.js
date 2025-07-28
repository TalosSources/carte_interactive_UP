function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;                   // Full hue range
  const saturation = 60 + (Math.abs(hash) % 20);      // 60–79% = soft saturation
//   const lightness = 80 + (Math.abs(hash) % 10);       // 80–89% = light, pastel
  const lightness = 92

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function normalizeString(str) {
    return str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
}