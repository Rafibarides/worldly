// Will contain country validation helpers 

// Map of territories to their sovereign countries (using exact GeoJSON names)
export const territoryMap = {
  'Greenland': 'Denmark',
  'Faeroe Is.': 'Denmark',
  'Palestine': 'Israel',
  'W. Bank': 'Israel',
  'Gaza': 'Israel',
  'Puerto Rico': 'United States of America',
  'Guam': 'United States of America',
  'U.S. Virgin Is.': 'United States of America',
  'N. Mariana Is.': 'United States of America',
  'American Samoa': 'United States of America',
  'Fr. Guiana': 'France',
  'Martinique': 'France',
  'Guadeloupe': 'France',
  'Reunion': 'France',
  'Mayotte': 'France',
  'Fr. Polynesia': 'France',
  'New Caledonia': 'France',
  'French S. and Antarctic Lands': 'France',
  'Curacao': 'Netherlands',
  'Aruba': 'Netherlands',
  'Sint Maarten': 'Netherlands',
  'Caribbean Netherlands': 'Netherlands',
  'Hong Kong': 'China',
  'Macao': 'China',
  'Cayman Is.': 'United Kingdom',
  'Bermuda': 'United Kingdom',
  'Turks and Caicos Is.': 'United Kingdom',
  'British Virgin Is.': 'United Kingdom',
  'Montserrat': 'United Kingdom',
  'Pitcairn Is.': 'United Kingdom',
  'Falkland Is.': 'United Kingdom',
  'Gibraltar': 'United Kingdom',
  'Christmas I.': 'Australia',
  'Norfolk Island': 'Australia',
  'Cocos Is.': 'Australia',
  'Heard I. and McDonald Is.': 'Australia',
  'Somaliland': 'Somalia',
};

// Map of country variations to their official names
export const countryVariations = {
  // Common abbreviations and variations
  'uk': 'united kingdom',
  'gb': 'united kingdom',
  'usa': 'united states',
  'us': 'united states',
  'america': 'united states',
  'united states': 'united states',
  'united states of america': 'united states',
  'uae': 'united arab emirates',
  'drc': 'democratic republic of the congo',
  'dr congo': 'democratic republic of the congo',
  'democratic republic of congo': 'democratic republic of the congo',
  'democratic republic of the congo': 'democratic republic of the congo',
  'car': 'central african republic',
  'central african republic': 'central african republic',
  'dr': 'dominican republic',
  'dominican republic': 'dominican republic',
  'png': 'papua new guinea',
  'roc': 'republic of the congo',
  'republic of congo': 'republic of the congo',
  'congo brazzaville': 'republic of the congo',
  'congo': 'republic of the congo',
  
  // Common variations
  'east timor': 'timor-leste',
  'timor': 'timor-leste',
  'burma': 'myanmar',
  'ivory coast': "côte d'ivoire",
  'cote divoire': "côte d'ivoire",
  'cote d ivoire': "côte d'ivoire",
  'czechia': 'czech republic',
  'czech republic': 'czech republic',
  'holland': 'netherlands',
  'macedonia': 'north macedonia',
  'swaziland': 'eswatini',
  'cape verde': 'cabo verde',
  'britain': 'united kingdom',
  'great britain': 'united kingdom',
  'england': 'united kingdom',
  'scotland': 'united kingdom',
  'wales': 'united kingdom',
  'northern ireland': 'united kingdom',
  'gambia': 'gambia',
  'the gambia': 'gambia',
  'ussr': 'russia',
  'soviet union': 'russia',
  'brasil': 'brazil',
  'brazil': 'brazil',
  
  // Multi-word countries and special characters
  'south korea': 'south korea',
  'north korea': 'north korea',
  'guinea bissau': 'guinea-bissau',
  'saudi': 'saudi arabia',
  'saudi arabia': 'saudi arabia',
  'bosnia': 'bosnia and herzegovina',
  'herzegovina': 'bosnia and herzegovina',
  'bosnia herzegovina': 'bosnia and herzegovina',
  'bosnia and herzegovina': 'bosnia and herzegovina',
  'trinidad': 'trinidad and tobago',
  'tobago': 'trinidad and tobago',
  'trinidad and tobago': 'trinidad and tobago',
  'antigua': 'antigua and barbuda',
  'barbuda': 'antigua and barbuda',
  'antigua and barbuda': 'antigua and barbuda',
  'saint kitts': 'saint kitts and nevis',
  'st kitts': 'saint kitts and nevis',
  'nevis': 'saint kitts and nevis',
  'saint kitts and nevis': 'saint kitts and nevis',
  'sao tome': 'são tomé and príncipe',
  'principe': 'são tomé and príncipe',
  'são tomé and príncipe': 'são tomé and príncipe',
  'st vincent': 'saint vincent and the grenadines',
  'saint vincent': 'saint vincent and the grenadines',
  'grenadines': 'saint vincent and the grenadines',
  'saint vincent and the grenadines': 'saint vincent and the grenadines',
  'micronesia': 'micronesia',
  'federated states of micronesia': 'micronesia',
  'vatican': 'vatican city',
  'vatican city': 'vatican city',
  'holy see': 'vatican city',
  'south sudan': 'south sudan',
  'equatorial guinea': 'equatorial guinea',
  'luxembourg': 'luxembourg',
  'luxemberg': 'luxembourg',
  'luxemburg': 'luxembourg',
  'morocco': 'morocco',
  'tanzenia': 'tanzania',
};

// Map of country variations to their GeoJSON names
export const geoJSONNameMap = {
  'united states': 'United States of America',
  'usa': 'United States of America',
  'us': 'United States of America',
  'america': 'United States of America',
  'united states of america': 'United States of America',
  'russia': 'Russia',
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'republic of the congo': 'Congo',
  'czech republic': 'Czech Rep.',
  'czechia': 'Czech Rep.',
  'central african republic': 'Central African Rep.',
  'dominican republic': 'Dominican Rep.',
  'united arab emirates': 'United Arab Emirates',
  'south korea': 'South Korea',
  'north korea': 'North Korea',
  'bosnia and herzegovina': 'Bosnia and Herz.',
  'antigua and barbuda': 'Antigua and Barb.',
  'trinidad and tobago': 'Trinidad and Tobago',
  'saint kitts and nevis': 'St. Kitts and Nevis',
  'são tomé and príncipe': 'São Tomé and Principe',
  'saint vincent and the grenadines': 'St. Vin. and Gren.',
  'equatorial guinea': 'Eq. Guinea',
  'east timor': 'Timor-Leste',
  'timor': 'Timor-Leste',
  'burma': 'Myanmar',
  'ivory coast': "Côte d'Ivoire",
  'holland': 'Netherlands',
  'macedonia': 'North Macedonia',
  'swaziland': 'eSwatini',
  'cape verde': 'Cabo Verde',
  'vatican': 'Vatican',
  'vatican city': 'Vatican',
  'holy see': 'Vatican',
  'denmark': 'Denmark',
  'brasil': 'Brazil',
  'luxemberg': 'Luxembourg',
  'luxemburg': 'Luxembourg',
  'morocco': 'Morocco',
  'tanzenia': 'Tanzania',
  'south sudan': 'S. Sudan',
};

// Helper function to normalize country names
export function normalizeCountryName(input) {
  const normalized = input.trim().toLowerCase()
    .replace(/['-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // First check variations map
  const mappedName = countryVariations[normalized];
  
  // If we have a mapping, check if it needs GeoJSON conversion
  if (mappedName) {
    // Force the return value to lower-case
    return (geoJSONNameMap[mappedName] || mappedName).toLowerCase();
  }
  
  // If no mapping found, check if the normalized input has a GeoJSON mapping
  const geoJSONName = geoJSONNameMap[normalized];
  if (geoJSONName) {
    return geoJSONName.toLowerCase();
  }

  // If still no match, try to find an exact match in Country_Names.json
  const countryNames = require('./Country_Names.json');
  const exactMatch = countryNames.find(
    country => country['Country Name'].toLowerCase() === normalized
  );
  
  // Always return a lower-case result for consistency
  return (exactMatch ? exactMatch['Country Name'] : normalized).toLowerCase();
}

// Helper function to get all territories for a country
export function getTerritoriesForCountry(countryName) {
  // For "Sudan" and "South Sudan", do not automatically add territories
  const normalized = countryName.trim().toLowerCase();
  if (normalized === "sudan" || normalized === "south sudan") {
    return [];
  }
  
  return Object.entries(territoryMap)
    .filter(([_, sovereign]) => sovereign.toLowerCase() === normalized)
    // Convert each territory to lowercase for consistent matching later
    .map(([territory]) => territory.toLowerCase());
}

// Helper function to check if a guess matches any territory
export function getTerritoryMatch(guess) {
  const normalizedGuess = guess.trim().toLowerCase();
  // Do not treat "sudan" or "south sudan" as a territory alias.
  if (normalizedGuess === "sudan" || normalizedGuess === "south sudan") {
    return undefined;
  }
  return territoryMap[normalizedGuess];
} 