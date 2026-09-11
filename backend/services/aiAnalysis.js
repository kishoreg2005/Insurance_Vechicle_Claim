const DAMAGE_TYPES = [
  'Dent', 'Scratch', 'Crack', 'Broken Glass', 'Bumper Damage',
  'Panel Deformation', 'Paint Damage', 'Headlight Damage', 'Mirror Damage'
];

const LOCATIONS = [
  'Front Bumper', 'Rear Bumper', 'Front Left Door', 'Front Right Door',
  'Rear Left Door', 'Rear Right Door', 'Hood', 'Trunk', 'Roof',
  'Front Left Fender', 'Front Right Fender', 'Windshield', 'Side Mirror'
];

const SEVERITIES = ['Minor', 'Moderate', 'Severe'];

const COST_CATEGORIES = ['Low', 'Medium', 'High'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDamageItems(count) {
  const items = [];
  const usedLocations = new Set();

  for (let i = 0; i < count; i++) {
    let location;
    do {
      location = randomItem(LOCATIONS);
    } while (usedLocations.has(location) && usedLocations.size < LOCATIONS.length);
    usedLocations.add(location);

    items.push({
      location,
      type: randomItem(DAMAGE_TYPES),
      severity: randomItem(SEVERITIES),
      confidence: randomInt(78, 98),
    });
  }
  return items;
}

function determineCostCategory(damages) {
  const severeCount = damages.filter((d) => d.severity === 'Severe').length;
  const moderateCount = damages.filter((d) => d.severity === 'Moderate').length;

  if (severeCount >= 2 || (severeCount >= 1 && moderateCount >= 2)) return 'High';
  if (severeCount >= 1 || moderateCount >= 2) return 'Medium';
  return 'Low';
}

function crossCheckClaimedDamage(claimedDamage, aiDamages) {
  const claimed = claimedDamage.toLowerCase();
  const keywords = claimed.split(/[\s,;.]+/).filter((w) => w.length > 3);

  const aiTypes = aiDamages.map((d) => d.type.toLowerCase());
  const aiLocations = aiDamages.map((d) => d.location.toLowerCase());

  let matchScore = 0;
  const matchedItems = [];
  const unmatchedItems = [];

  for (const damage of aiDamages) {
    const typeMatch = keywords.some((k) => damage.type.toLowerCase().includes(k) || k.includes(damage.type.toLowerCase().split(' ')[0]));
    const locMatch = keywords.some((k) => damage.location.toLowerCase().includes(k) || k.includes(damage.location.toLowerCase().split(' ')[0]));

    if (typeMatch || locMatch) {
      matchScore++;
      matchedItems.push(damage);
    } else {
      unmatchedItems.push(damage);
    }
  }

  const totalAi = aiDamages.length;
  const matchPercentage = totalAi > 0 ? Math.round((matchScore / totalAi) * 100) : 0;

  let status;
  if (matchPercentage >= 70) status = 'Consistent';
  else if (matchPercentage >= 40) status = 'Partial Match';
  else status = 'Discrepancy Detected';

  return {
    status,
    matchPercentage,
    matchedItems,
    unmatchedItems,
    summary: matchPercentage >= 70
      ? 'AI assessment aligns well with the claimed damage description.'
      : matchPercentage >= 40
        ? 'Some differences found between claimed damage and AI detection. Manual review recommended.'
        : 'Significant discrepancy between claimed damage and AI assessment. Further investigation required.',
  };
}

async function analyzeVehicleDamage(claimedDamage, photoCount) {
  await new Promise((resolve) => setTimeout(resolve, 2500 + Math.random() * 1500));

  const damageCount = Math.min(Math.max(photoCount, 1), 4);
  const detectedDamages = generateDamageItems(damageCount);
  const estimatedCost = determineCostCategory(detectedDamages);
  const crossCheck = crossCheckClaimedDamage(claimedDamage, detectedDamages);

  return {
    analysisId: `AI-${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    photoCount,
    detectedDamages,
    estimatedRepairCost: estimatedCost,
    costRange: {
      Low: '₹5,000 – ₹25,000',
      Medium: '₹25,000 – ₹75,000',
      High: '₹75,000 – ₹2,00,000+',
    }[estimatedCost],
    overallAssessment: `Based on analysis of ${photoCount} image(s), ${detectedDamages.length} damage area(s) detected with ${estimatedCost.toLowerCase()} repair cost estimate.`,
    crossCheck,
  };
}

module.exports = { analyzeVehicleDamage };
