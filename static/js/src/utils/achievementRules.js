export const CERTIFICATE_LEVEL_POINTS = {
  Международный: 30,
  Всеросийский: 25,
  Ведомственный: 15,
  Региональный: 10,
};

export const CERTIFICATE_PLACE_MULTIPLIERS = {
  Победитель: 1.25,
  "Призёр": 1,
  Участник: 0.5,
};

export const CERTIFICATE_LEVEL_VALUES = Object.keys(CERTIFICATE_LEVEL_POINTS);
export const CERTIFICATE_PLACE_VALUES = Object.keys(CERTIFICATE_PLACE_MULTIPLIERS);

export function calculateCertificatePoints(level, place) {
  const base = CERTIFICATE_LEVEL_POINTS[level];
  const multiplier = CERTIFICATE_PLACE_MULTIPLIERS[place];
  if (typeof base !== "number") throw new Error("Некорректный уровень грамоты");
  if (typeof multiplier !== "number") throw new Error("Некорректное место грамоты");
  return Math.round(base * multiplier * 100) / 100;
}

