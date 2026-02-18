/**
 * Utilidades de fecha para retos diarios.
 * Los retos cambian a las 2:00 AM (Madrid).
 */

/** Fecha del día actual para la semilla. Los retos cambian a las 2:00 AM (Madrid). */
export function getDateKey(timezone = 'Europe/Madrid'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  const hour = parseInt(get('hour'), 10);
  let year = parseInt(get('year'), 10);
  let month = parseInt(get('month'), 10);
  let day = parseInt(get('day'), 10);

  if (hour < 2) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Obtiene el dateKey para un timestamp (para comparar si un reto es de un día anterior). */
export function getDateKeyForTimestamp(isoString: string, timezone = 'Europe/Madrid'): string {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  const hour = parseInt(get('hour'), 10);
  let year = parseInt(get('year'), 10);
  let month = parseInt(get('month'), 10);
  let day = parseInt(get('day'), 10);

  if (hour < 2) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
