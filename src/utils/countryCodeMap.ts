const alpha3ToAlpha2: Record<string, string> = {
  // --- ASIA ---
  AFG: 'AF', ARM: 'AM', AZE: 'AZ', BHR: 'BH', BGD: 'BD', BTN: 'BT', BRN: 'BN', KHM: 'KH',
  CHN: 'CN', CYP: 'CY', GEO: 'GE', HKG: 'HK', IND: 'IN', IDN: 'ID', IRN: 'IR', IRQ: 'IQ',
  ISR: 'IL', JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LBN: 'LB',
  MAC: 'MO', MYS: 'MY', MDV: 'MV', MNG: 'MN', MMR: 'MM', NPL: 'NP', PRK: 'KP', OMN: 'OM',
  PAK: 'PK', PSE: 'PS', PHL: 'PH', QAT: 'QA', SAU: 'SA', SGP: 'SG', KOR: 'KR', LKA: 'LK',
  SYR: 'SY', TWN: 'TW', TJK: 'TJ', THA: 'TH', TLS: 'TL', TUR: 'TR', TKM: 'TM', UZB: 'UZ',
  VNM: 'VN', YEM: 'YE',
  // Sports Aliases (requested)
  INA: 'ID', // Indonesia (IOC/FIFA)
  MAS: 'MY', // Malaysia (IOC/FIFA)

  // --- AMERICAS ---
  USA: 'US', CAN: 'CA', MEX: 'MX', ARG: 'AR', BRA: 'BR', BOL: 'BO', CHL: 'CL', COL: 'CO', 
  CRI: 'CR', CUB: 'CU', DOM: 'DO', ECU: 'EC', SLV: 'SV', GTM: 'GT', HND: 'HN', JAM: 'JM', 
  NIC: 'NI', PAN: 'PA', PRY: 'PY', PER: 'PE', PRI: 'PR', URY: 'UY', VEN: 'VE', HTI: 'HT',
  BHS: 'BS', BRB: 'BB', BLZ: 'BZ', GUY: 'GY', SUR: 'SR', TTO: 'TT',

  // --- EUROPE ---
  ALB: 'AL', AND: 'AD', AUT: 'AT', BLR: 'BY', BEL: 'BE', BIH: 'BA', BGR: 'BG', HRV: 'HR',
  CZE: 'CZ', DNK: 'DK', EST: 'EE', FIN: 'FI', FRA: 'FR', DEU: 'DE', GRC: 'GR', HUN: 'HU',
  ISL: 'IS', IRL: 'IE', ITA: 'IT', LVA: 'LV', LIE: 'LI', LTU: 'LT', LUX: 'LU', MLT: 'MT',
  MDA: 'MD', MCO: 'MC', MNE: 'ME', NLD: 'NL', MKD: 'MK', NOR: 'NO', POL: 'PL', PRT: 'PT',
  ROU: 'RO', RUS: 'RU', SRB: 'RS', SVK: 'SK', SVN: 'SI', ESP: 'ES', SWE: 'SE', CHE: 'CH',
  UKR: 'UA', GBR: 'GB', VAT: 'VA', SMR: 'SM',

  // --- AFRICA ---
  DZA: 'DZ', AGO: 'AO', BEN: 'BJ', BWA: 'BW', BFA: 'BF', BDI: 'BI', CMR: 'CM', CPV: 'CV',
  CAF: 'CF', TCD: 'TD', COG: 'CG', COD: 'CD', DJI: 'DJ', EGY: 'EG', GNQ: 'GQ', ERI: 'ER',
  ETH: 'ET', GAB: 'GA', GMB: 'GM', GHA: 'GH', GIN: 'GN', GNB: 'GW', CIV: 'CI', KEN: 'KE',
  LSO: 'LS', LBR: 'LR', LBY: 'LY', MDG: 'MG', MWI: 'MW', MLI: 'ML', MRT: 'MR', MUS: 'MU',
  MAR: 'MA', MOZ: 'MZ', NAM: 'NA', NER: 'NE', NGA: 'NG', RWA: 'RW', SEN: 'SN', SYC: 'SC',
  SLE: 'SL', SOM: 'SO', ZAF: 'ZA', SSD: 'SS', SDN: 'SD', TZA: 'TZ', TGO: 'TG', TUN: 'TN',
  UGA: 'UG', ZMB: 'ZM', ZWE: 'ZW',

  // --- OCEANIA ---
  AUS: 'AU', FJI: 'FJ', KIR: 'KI', MHL: 'MH', FSM: 'FM', NRU: 'NR', NZL: 'NZ', PLW: 'PW',
  PNG: 'PG', SAM: 'WS', SLB: 'SB', TON: 'TO', TUV: 'TV', VUT: 'VU',
};

export const getAlpha2Code = (alpha3Code: string | null | undefined): string | null => {
  if (!alpha3Code) return null;
  const sanitized = alpha3Code.trim().toUpperCase();
  return alpha3ToAlpha2[sanitized] || null;
};

const customFlags: Record<string, string> = {
  TPE: 'tpe', // Taiwan (IOC)
};

export const getCustomFlagPath = (alpha3Code: string | null | undefined): string | null => {
  if (!alpha3Code) return null;
  const customCode = customFlags[alpha3Code.toUpperCase()];
  return customCode ? `/images/flags/${customCode}.svg` : null;
};