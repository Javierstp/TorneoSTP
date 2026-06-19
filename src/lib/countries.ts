import type { Country } from '../types'

export const COUNTRIES: Country[] = [
  { code: 'QAT', alpha2: 'qa', name: 'Qatar' },
  { code: 'ECU', alpha2: 'ec', name: 'Ecuador' },
  { code: 'SEN', alpha2: 'sn', name: 'Senegal' },
  { code: 'NED', alpha2: 'nl', name: 'Países Bajos' },
  { code: 'ENG', alpha2: 'gb-eng', name: 'Inglaterra' },
  { code: 'IRN', alpha2: 'ir', name: 'Irán' },
  { code: 'USA', alpha2: 'us', name: 'Estados Unidos' },
  { code: 'WAL', alpha2: 'gb-wls', name: 'Gales' },
  { code: 'ARG', alpha2: 'ar', name: 'Argentina' },
  { code: 'KSA', alpha2: 'sa', name: 'Arabia Saudita' },
  { code: 'MEX', alpha2: 'mx', name: 'México' },
  { code: 'POL', alpha2: 'pl', name: 'Polonia' },
  { code: 'FRA', alpha2: 'fr', name: 'Francia' },
  { code: 'AUS', alpha2: 'au', name: 'Australia' },
  { code: 'DEN', alpha2: 'dk', name: 'Dinamarca' },
  { code: 'TUN', alpha2: 'tn', name: 'Túnez' },
  { code: 'ESP', alpha2: 'es', name: 'España' },
  { code: 'CRC', alpha2: 'cr', name: 'Costa Rica' },
  { code: 'GER', alpha2: 'de', name: 'Alemania' },
  { code: 'JPN', alpha2: 'jp', name: 'Japón' },
  { code: 'BEL', alpha2: 'be', name: 'Bélgica' },
  { code: 'CAN', alpha2: 'ca', name: 'Canadá' },
  { code: 'MAR', alpha2: 'ma', name: 'Marruecos' },
  { code: 'CRO', alpha2: 'hr', name: 'Croacia' },
  { code: 'BRA', alpha2: 'br', name: 'Brasil' },
  { code: 'SRB', alpha2: 'rs', name: 'Serbia' },
  { code: 'SUI', alpha2: 'ch', name: 'Suiza' },
  { code: 'CMR', alpha2: 'cm', name: 'Camerún' },
  { code: 'POR', alpha2: 'pt', name: 'Portugal' },
  { code: 'GHA', alpha2: 'gh', name: 'Ghana' },
  { code: 'URU', alpha2: 'uy', name: 'Uruguay' },
  { code: 'KOR', alpha2: 'kr', name: 'Corea del Sur' },
  // Extra
  { code: 'ITA', alpha2: 'it', name: 'Italia' },
  { code: 'COL', alpha2: 'co', name: 'Colombia' },
  { code: 'CHI', alpha2: 'cl', name: 'Chile' },
  { code: 'PER', alpha2: 'pe', name: 'Perú' },
  { code: 'NGA', alpha2: 'ng', name: 'Nigeria' },
  { code: 'EGY', alpha2: 'eg', name: 'Egipto' },
  { code: 'SWE', alpha2: 'se', name: 'Suecia' },
  { code: 'UKR', alpha2: 'ua', name: 'Ucrania' },
]

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
