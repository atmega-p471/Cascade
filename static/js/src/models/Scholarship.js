/**
 * Итог расчёта: сумма баллов и разбивка по категориям (без денег).
 */
export class Scholarship {
  /**
   * @param {object} data
   * @param {number} data.totalPoints
   * @param {Array<{ label: string, points: number }>} data.breakdown
   * @param {string} [data.periodLabel]
   */
  constructor({ totalPoints, breakdown, periodLabel = "текущий семестр" }) {
    this.totalPoints = totalPoints;
    this.breakdown = breakdown;
    this.periodLabel = periodLabel;
  }
}
