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
  'denmark': 'Greenland',
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
  'dr': 'dominicanrepublic',
  'dominicanrepublic': 'dominicanrepublic',
  'dominican': 'dominicanrepublic',
  'dominicanrep': 'dominicanrepublic',
  'dominican republic': 'dominicanrepublic',
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
  'cotedivoire': "côte d'ivoire",
  "côte d'ivoire" : "côte d'ivoire",
  "côtedivoire": "côte d'ivoire",
  "côte d'ivoire" : "côte d'ivoire",
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
  "czechia": "czech republic",
  "czech republic": "czech republic",
  "czech": "czech republic",
  "chzech republic": "czech republic",
  "chzechia": "czech republic",
  "czeck republic": "czech republic",
  "czeckia": "czech republic",
  "the czech republic": "czechia",
  "czechrep": "czechia",
  "czech rep": "czechia",
  "chech republic": "czechia",
  "ceh republic": "czechia",
  "chechia": "czechia",
  "the czechia": "czechia",
  "chekeslovakia": "czech republic",
  "chek slovakia": "czech republic",
  "chekeslovkia": "czech republic",
  "chekslovkia": "czech republic",
  "chek slovkia": "czech republic",
  "denmark": "greenland",
  
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
  'saint lucia': 'saint lucia',
  'st lucia': 'saint lucia',
  'saint lucia': 'st lucia',
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
  'philippines': 'Philippines',
  'phillippines': 'Philipines',
  'phillippines': 'Philipines',
  'filipinas': 'Philippines',
  'filipines': 'Philippines',
  'filipins': 'Philippines',
  'philipino': 'Philippines',
  'Filipino': 'Philippines',
  'antiguaandbarb': 'Antigua and Barb.',
  // Additional aliases for Antigua and Barbuda
  'antigua': 'antiguaandbarbuda',
  'barbuda': 'antiguaandbarbuda',
  'antiguaandbarb': 'antiguaandbarbuda',
  'antiguabarbuda': 'antiguaandbarbuda',
  'antiguaandbarbuda': 'antiguaandbarbuda',
  // Special alias: when a user types "denmark", return "greenland" (as per Country_Names.json)
  'denmark': 'greenland',
  // Add additional aliases as needed.
  "saintkitts": "saintkittsandnevis",
  "stkitts": "saintkittsandnevis",
  "stkittsandnevis": "saintkittsandnevis",
  "saintkittsnevis": "saintkittsandnevis",
  "kittsandnevis": "saintkittsandnevis",
  "kittsnevis": "saintkittsandnevis",
  "nevis": "saintkittsandnevis",
  "trinidadtobago": "trinidadandtobago",
  "trinidadandtobago": "trinidadandtobago",
  "trinidad": "trinidadandtobago",
  "tobago": "trinidadandtobago",
  "unitedstates": "unitedstates",
  "unitedstatesofamerica": "unitedstates",
  "usa": "unitedstates",
  "us": "unitedstates",
  "america": "unitedstates",
  "dominicanrepublic": "dominicanrepublic",
  "dominican": "dominicanrepublic",
  "antiguaandbarbuda": "antiguaandbarbuda",
  "antigua": "antiguaandbarbuda",
  "barbuda": "antiguaandbarbuda",
  "saintvincent": "saintvincentandthegrenadines",
  "stvincentgrenadines": "saintvincentandthegrenadines",
  "stvincent": "saintvincentandthegrenadines",
  "grenadines": "saintvincentandthegrenadines",
  "dominicanrep": "dominicanrepublic",
  "capo verde": "caboverde",
  "cabo verde": "caboverde",
  "cabo verde": "cape verde",
  "green cape": "caboverde",
  // Add explicit entries for Dominica to ensure it's treated as a separate country
  'dominica': 'dominica',
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
  'czech republic': 'Czech Republic',
  'czechia': 'Czech Republic',
  'czech': 'Czech Republic',
  'czechrep': 'Czechia',
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
  'equatorialguinea': 'Eq. Guinea',
  'eq guinea': 'Eq. Guinea',
  'eqguinea': 'Eq. Guinea',
  'eq. guinea': 'Eq. Guinea',
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
  'southsudan': 'S. Sudan',
  's sudan': 'S. Sudan',
  'ssudan': 'S. Sudan',
  's. sudan': 'S. Sudan',
  'saint lucia': 'St. Lucia',
  'saint kitts': 'St. Kitts',
  'saint lucia': 'st Lucia',
  'kazakhstan': 'Kazakhstan',
  'khazakhstan': 'Kazakhstan',
  'kazakhstan': 'Kazakhstan',
  'kazakistan': 'Kazakhstan',
  'kazakhstan': 'Kazakstan',
  'philippines': 'Philippines',
  'phillippines': 'Philipines',
  'phillippines': 'Philipines',
  'filipinas': 'Philippines',
  'czech republic': 'Czechia',
  'czechia': 'Czechia',
  'czech': 'Czechia',
  'czech rep': 'Czechia',
  'chech republic': 'Czechia',
  'chechia': 'Czechia',
  
  // --- Additional failsafe entries for St. Lucia, St. Vincent, and St. Kitts ---
  'stlucia': 'St. Lucia',
  'saintlucia': 'St. Lucia',
  'stvincent': 'St. Vin. and Gren.',
  'saintvincent': 'St. Vin. and Gren.',
  'stkitts': 'St. Kitts and Nevis',
  'saintkitts': 'St. Kitts and Nevis',
  'stkittsandnevis': 'St. Kitts and Nevis',
  'saintkittsandnevis': 'St. Kitts and Nevis',
  // --- Additional failsafe entry for Antigua and Barbuda ---
  'antiguabarbuda': 'Antigua and Barb.',
  'antigua': 'antiguabarbuda',
  'barbuda': 'antiguabarbuda',
  'antiguaandbarbuda': 'Antigua and Barb.',
  // --- Additional failsafe proper names based on GeoJSON features ---
  'czechrepublic': 'czechrepublic',
  'czechia': 'czechrepublic',
  'czech': 'czechrepublic',
  'czechrep': 'czechrepublic',
  'czech rep': 'czechrepublic',
  'chech republic': 'czechrepublic',
  'chechia': 'czechrepublic',
  'antigua and barbuda': 'Antigua and Barb.',
  'antiguabarbuda': 'Antigua and Barb.',
  'antiguaandbarbuda': 'Antigua and Barb.',
  'green cape': 'Cabo Verde',
  'cabo verde': 'Cabo Verde',
  'caboverde': 'Cabo Verde',
  'cape verde': 'Cabo Verde',
  'green cape': 'Cabo Verde',
  
  // Fix for South Sudan - ensure exact match with "S. Sudan" (capital S)
  'south sudan': 'S. Sudan',
  'southsudan': 'S. Sudan',
  's sudan': 'S. Sudan',
  'ssudan': 'S. Sudan',
  's. sudan': 'S. Sudan',
  
  // Fix for Dominican Republic - ensure exact match with "Dominican Rep."
  'dominican republic': 'Dominican Rep.',
  'dominicanrepublic': 'Dominican Rep.',
  'dominican rep': 'Dominican Rep.',
  'dominicanrep': 'Dominican Rep.',
  'dr': 'Dominican Rep.',
  
  // Fix for Democratic Republic of Congo - ensure exact match with "Dem. Rep. Congo"
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'democraticrepublicofthecongo': 'Dem. Rep. Congo',
  'democratic republic of congo': 'Dem. Rep. Congo',
  'democraticrepublicofcongo': 'Dem. Rep. Congo',
  'drc': 'Dem. Rep. Congo',
  'dem rep congo': 'Dem. Rep. Congo',
  'demrepcongo': 'Dem. Rep. Congo',
  
  // Fix for Equatorial Guinea - ensure exact match with "Eq. Guinea"
  'equatorial guinea': 'Eq. Guinea',
  'equatorialguinea': 'Eq. Guinea',
  'eq guinea': 'Eq. Guinea',
  'eqguinea': 'Eq. Guinea',
  'eq. guinea': 'Eq. Guinea',
  
  // Add additional aliases as needed.
};

// Add an alias mapping to handle variations in country naming.
const aliasMapping = {
  "dominican republic": "dominican rep.",
  "dominican rep": "dominican rep.",
  "dr": "dominicanrepublic",
  "dominican": "dominicanrepublic",
  "dominican rep.": "dominican rep.",
  "dominican rep": "dominican rep.",
};

// Updated normalizeCountryName function
export const normalizeCountryName = (name) => {
  if (!name || typeof name !== 'string') return '';

  // First, handle special cases explicitly to ensure consistent normalization
  if (name.includes("Ivory Coast") || name.includes("Côte d'Ivoire")) {
    return "cotedivoire";
  }
  if (name.includes("Eswatini") || name.includes("Swaziland")) {
    return "eswatini";
  }
  if (name.includes("São Tomé") || name.includes("Sao Tome")) {
    return "saotomeandprincipe";
  }
  if (name.includes("Czech") || name.includes("Czechia")) {
    return "czechrepublic";
  }
  if (name.includes("Myanmar") || name.includes("Burma")) {
    return "myanmar";
  }

  // Remove parenthetical content
  let normalized = name.replace(/\s*\(.*?\)/g, '').trim();
  
  // Lowercase
  normalized = normalized.toLowerCase();

  // Remove diacritics (accents)
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove punctuation and extra whitespace
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g, '');
  normalized = normalized.replace(/\s+/g, '');

  // Define aliases to map commonly used variants to a canonical name
  const aliases = {
    'us': 'unitedstatesofamerica',
    'usa': 'unitedstatesofamerica',
    'america': 'unitedstatesofamerica',
    'unitedstates': 'unitedstatesofamerica',
    'unitedstatesofamerica': 'unitedstatesofamerica',
    'uk': 'unitedkingdom',
    'greatbritain': 'unitedkingdom',
    'england': 'unitedkingdom',
    'brasil': 'brazil',
    'brazil': 'brazil',
    'burma': 'myanmar',
    'myanmar': 'myanmar',
    'myanmarburma': 'myanmar',
    'kazakhstan': 'kazakstan',
    'uae': 'unitedarabemirates',
    'car': 'centralafricanrepublic',
    'centralafricanrep': 'centralafricanrepublic',
    'dr': "dominicanrepublic",
    'drc': 'democraticrepublicofthecongo',
    'democraticrepublicofthecongo': 'democraticrepublicofthecongo',
    'republicofthecongo': 'republicofthecongo',
    'congo': 'republicofthecongo',
    'denmark': 'greenland',
    'ivorycoast': 'cotedivoire',
    'cotedivoire': 'cotedivoire',
    'coted': 'cotedivoire',
    'cotedivoir': 'cotedivoire',
    'cotedivior': 'cotedivoire',
    'coteivoire': 'cotedivoire',
    'cotedeivoire': 'cotedivoire',
    'côtedivoire': 'cotedivoire',
    'côtedivoir': 'cotedivoire',
    'eswatini': 'eswatini',
    'swaziland': 'eswatini',
    'saotome': 'saotomeandprincipe',
    'saotomeandprincipe': 'saotomeandprincipe',
    'czechrepublic': 'czechrepublic',
    'czechia': 'czechrepublic',
    'czech': 'czechrepublic',
    // ... other aliases as needed
  };

  // After all the normalization steps, check if we need to map to a GeoJSON name
  const normalizedForScoring = aliases[normalized] || normalized;
  
  // Return the GeoJSON name if it exists, otherwise return the normalized name
  return geoJSONNameMap[normalizedForScoring] || normalizedForScoring;
};

// Helper function to get all territories for a country
export function getTerritoriesForCountry(countryName) {
  const normalized = countryName.trim().toLowerCase();
  
  // Special case: if the normalized name is "greenland", return only Greenland
  if (normalized === "greenland") {
    return ["greenland"];
  }

  // For "Sudan" and "South Sudan", do not automatically add territories
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
  // Special handling: if user types "denmark" (or "greenland"), return "Greenland"
  if (normalizedGuess === "denmark" || normalizedGuess === "greenland") {
    return "Greenland";
  }
  // Special handling: if user types "somalia", return "Somaliland" as well
  if (normalizedGuess === "somalia" || normalizedGuess === "somaliland") {
    return "Somaliland";
  }
  const key = Object.keys(territoryMap).find(
    k => k.toLowerCase() === normalizedGuess
  );
  return key ? territoryMap[key] : undefined;
} 