/**
 * Formatea una fecha a string YYYY-MM-DD
 */
export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string YYYY-MM-DD a objeto Date local sin desajuste de zona horaria
 */
export function parseDateIso(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * REGLA DEL DÍA ANCLA FIJO:
 * Avanza exactamente 1 mes respetando el día del mes original.
 * Si el día no existe (ej: 31 de abril), lo ajusta al último día válido de ese mes (30 de abril).
 */
export function getNextFixedMonthDate(currentScheduledDateStr: string, diaAncla: number): string {
  const current = parseDateIso(currentScheduledDateStr);
  let nextYear = current.getFullYear();
  let nextMonth = current.getMonth() + 1; // Mes siguiente (0-11)

  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  // Obtenemos los días totales del mes destino
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  
  // Si el día ancla es 31 y el mes tiene 30 días, se ajusta a 30
  const adjustedDay = Math.min(diaAncla, daysInNextMonth);

  const nextDate = new Date(nextYear, nextMonth, adjustedDay);
  return formatDateIso(nextDate);
}

/**
 * Calcula la diferencia en días entre targetDate y baseDate (target - base)
 */
export function getDaysDifference(targetDateStr: string, baseDate: Date = new Date()): number {
  const target = parseDateIso(targetDateStr);
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}