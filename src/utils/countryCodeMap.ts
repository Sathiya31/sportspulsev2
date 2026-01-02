const iocToAlpha2: Record<string, string> = {
  // --- UK CONSTITUENT NATIONS (FIFA/Commonwealth) ---
  ENG: 'GB-ENG', // England - Note: Many flag libraries use 'GB-ENG' or just 'GB'
  SCO: 'GB-SCT', // Scotland
  WAL: 'GB-WLS', // Wales
  NIR: 'GB-NIR', // Northern Ireland

  // --- A ---
  AFG: 'AF', ALB: 'AL', ALG: 'DZ', AND: 'AD', ANG: 'AO', ANT: 'AG', ARG: 'AR', ARM: 'AM', 
  ARU: 'AW', ASA: 'AS', AUS: 'AU', AUT: 'AT', AZE: 'AZ',
  
  // --- B ---
  BAH: 'BS', BAN: 'BD', BAR: 'BB', BDI: 'BI', BEL: 'BE', BEN: 'BJ', BER: 'BM', BHU: 'BT', 
  BIH: 'BA', BIZ: 'BZ', BLR: 'BY', BOL: 'BO', BOT: 'BW', BRA: 'BR', BRN: 'BH', BRU: 'BN', 
  BUL: 'BG', BUR: 'BF',
  
  // --- C ---
  CAF: 'CF', CAM: 'KH', CAN: 'CA', CAY: 'KY', CGO: 'CG', CHA: 'TD', CHI: 'CL', CHN: 'CN', 
  CIV: 'CI', CMR: 'CM', COD: 'CD', COK: 'CK', COL: 'CO', COM: 'KM', CPV: 'CV', CRC: 'CR', 
  CRO: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ',
  
  // --- D ---
  DEN: 'DK', DJI: 'DJ', DMA: 'DM', DOM: 'DO',
  
  // --- E ---
  ECU: 'EC', EGY: 'EG', ERI: 'ER', ESA: 'SV', ESP: 'ES', EST: 'EE', ETH: 'ET',
  
  // --- F ---
  FIJ: 'FJ', FIN: 'FI', FRA: 'FR', FSM: 'FM',
  
  // --- G ---
  GAB: 'GA', GAM: 'GM', GBR: 'GB', GBS: 'GW', GEO: 'GE', GEQ: 'GQ', GER: 'DE', GHA: 'GH', 
  GRE: 'GR', GRN: 'GD', GUA: 'GT', GUM: 'GU', GUY: 'GY',
  
  // --- H ---
  HAI: 'HT', HKG: 'HK', HON: 'HN', HUN: 'HU',
  
  // --- I ---
  INA: 'ID', IND: 'IN', IRI: 'IR', IRL: 'IE', IRQ: 'IQ', ISL: 'IS', ISR: 'IL', 
  ISV: 'VI', ITA: 'IT', IVB: 'VG',
  
  // --- J ---
  JAM: 'JM', JOR: 'JO', JPN: 'JP', KAZ: 'KZ', KEN: 'KE', KGZ: 'KG', KIR: 'KI', 
  KOR: 'KR', KSA: 'SA', KWT: 'KW',
  
  // --- L ---
  LAO: 'LA', LAT: 'LV', LBA: 'LY', LBN: 'LB', LBR: 'LR', LCA: 'LC', LIE: 'LI', 
  LKA: 'LK', LSO: 'LS', LTU: 'LT', LUX: 'LU',
  
  // --- M ---
  MAD: 'MG', MAR: 'MA', MAS: 'MY', MAW: 'MW', MDA: 'MD', MDV: 'MV', MEX: 'MX', 
  MGL: 'MN', MHL: 'MH', MKD: 'MK', MLI: 'ML', MLT: 'MT', MNE: 'ME', MON: 'MC', 
  MOZ: 'MZ', MRI: 'MU', MTN: 'MR', MYA: 'MM',
  
  // --- N ---
  NAM: 'NA', NCA: 'NI', NED: 'NL', NEP: 'NP', NGR: 'NG', NIG: 'NE', NOR: 'NO', 
  NZL: 'NZ', OMN: 'OM',
  
  // --- P ---
  PAK: 'PK', PAN: 'PA', PAR: 'PY', PER: 'PE', PHI: 'PH', PLE: 'PS', PLW: 'PW', 
  PNG: 'PG', POL: 'PL', POR: 'PT', PRK: 'KP', PUR: 'PR',
  
  // --- Q ---
  QAT: 'QA', ROU: 'RO', RSA: 'ZA', RUS: 'RU', ROC: 'RU', RWA: 'RW',
  
  // --- S ---
  SAM: 'WS', SEN: 'SN', SEY: 'SC', SGP: 'SG', SKN: 'KN', SLE: 'SL', SLO: 'SI', 
  SMR: 'SM', SOL: 'SB', SOM: 'SO', SRB: 'RS', SRI: 'LK', SSD: 'SS', STP: 'ST', 
  SUD: 'SD', SUI: 'CH', SUR: 'SR', SVK: 'SK', SWE: 'SE', SWZ: 'SZ', SYR: 'SY',
  
  // --- T ---
  TAN: 'TZ', TGA: 'TO', THA: 'TH', TJK: 'TJ', TKM: 'TM', TLS: 'TL', TOG: 'TG', 
  TPE: 'TW', TTO: 'TT', TUN: 'TN', TUR: 'TR', TUV: 'TV',
  
  // --- U ---
  UAE: 'AE', UGA: 'UG', UKR: 'UA', URU: 'UY', USA: 'US', UZB: 'UZ',
  
  // --- V ---
  VAN: 'VU', VAT: 'VA', VEN: 'VE', VIE: 'VN', VIN: 'VC',
  
  // --- Y/Z ---
  YEM: 'YE', ZAM: 'ZM', ZIM: 'ZW'
};

export const getAlpha2Code = (alpha3Code: string | null | undefined): string | null => {
  if (!alpha3Code) return null;
  const sanitized = alpha3Code.trim().toUpperCase();
  return iocToAlpha2[sanitized] || null;
};

const customFlags: Record<string, string> = {
  TPE: 'tpe', // Taiwan (IOC)
};

export const getCustomFlagPath = (alpha3Code: string | null | undefined): string | null => {
  if (!alpha3Code) return null;
  const customCode = customFlags[alpha3Code.toUpperCase()];
  return customCode ? `/images/flags/${customCode}.svg` : null;
};