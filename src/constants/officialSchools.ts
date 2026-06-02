/** Nombres oficiales alineados con el catálogo en BD (uso en mocks y modo sin API). */
export const OFFICIAL_SCHOOL_NAMES = [
  'Bellas Artes',
  'Especializaciones',
  'Transformación Empresarial',
  'Transversales',
  'Ingenierías',
  'Negocios',
] as const;

export type OfficialSchoolName = (typeof OFFICIAL_SCHOOL_NAMES)[number];
