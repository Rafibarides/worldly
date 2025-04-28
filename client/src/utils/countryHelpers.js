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
  'st vincent': 'saintvincentandthegrenadines',
  'saint vincent': 'saintvincentandthegrenadines',
  'grenadines': 'saintvincentandthegrenadines',
  'saint vincent and the grenadines': 'saintvincentandthegrenadines',
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
  "dominicanrepublic": "dominican rep.",
  "dominican": "dominican rep.",
  "antiguaandbarbuda": "antiguaandbarbuda",
  "antigua": "antiguaandbarbuda",
  "barbuda": "antiguaandbarbuda",
  "saintvincent": "saintvincentandthegrenadines",
  "stvincentgrenadines": "saintvincentandthegrenadines",
  "stvincent": "saintvincentandthegrenadines",
  "grenadines": "saintvincentandthegrenadines",
  "dominicanrep": "dominican rep.",
  "capo verde": "caboverde",
  "cabo verde": "caboverde",
  "cabo verde": "cape verde",
  "green cape": "caboverde",
  // Add explicit entries for Dominica to ensure it's treated as a separate country
  'dominica': 'dominica',
  'st vincent': 'saintvincentandthegrenadines',
  'stvincent': 'saintvincentandthegrenadines',
  'saint vincent': 'saintvincentandthegrenadines',
  'antigua': 'antiguaandbarbuda',
  
  // Make sure these entries are properly defined (around line 204-207)
  'saintvincent': 'saintvincentandthegrenadines',
  'stvincentgrenadines': 'saintvincentandthegrenadines',
  'stvincent': 'saintvincentandthegrenadines',
  'grenadines': 'saintvincentandthegrenadines',
  'marshall islands': 'marshall islands',
  'marshall is': 'marshall islands',
  'marshall is.': 'marshall islands',
  'marshallislands': 'marshall islands',
  'marshallis': 'marshall islands',
  'marshallisles': 'marshall islands',
  
  'solomon islands': 'solomon islands',
  'solomon is': 'solomon islands',
  'solomon is.': 'solomon islands',
  'solomonislands': 'solomon islands',
  'solomonis': 'solomon islands',
  'solomonisles': 'solomon islands',
  
  // Add similar entries for other island nations that might have this issue
  'cayman islands': 'cayman islands',
  'cayman is': 'cayman islands',
  'cayman is.': 'cayman islands',
  
  'falkland islands': 'falkland islands',
  'falkland is': 'falkland islands',
  'falkland is.': 'falkland islands',
  
  'faroe islands': 'faroe islands',
  'faeroe islands': 'faroe islands',
  'faroe is': 'faroe islands',
  'faeroe is': 'faroe islands',
  'faroe is.': 'faroe islands',
  'faeroe is.': 'faroe islands',
  
  'british virgin islands': 'british virgin islands',
  'british virgin is': 'british virgin islands',
  'british virgin is.': 'british virgin islands',
  
  'us virgin islands': 'us virgin islands',
  'us virgin is': 'us virgin islands',
  'us virgin is.': 'us virgin islands',
  'u.s. virgin islands': 'us virgin islands',
  'u.s. virgin is': 'us virgin islands',
  'u.s. virgin is.': 'us virgin islands',
  
  'turks and caicos islands': 'turks and caicos islands',
  'turks and caicos is': 'turks and caicos islands',
  'turks and caicos is.': 'turks and caicos islands',
  
  'pitcairn islands': 'pitcairn islands',
  'pitcairn is': 'pitcairn islands',
  'pitcairn is.': 'pitcairn islands',
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
  'stvincent': 'St. Vincent and the Grenadines',
  'saintvincent': 'St. Vincent and the Grenadines',
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
  'marshall islands': 'Marshall Is.',
  'marshallislands': 'Marshall Is.',
  'marshall is': 'Marshall Is.',
  'marshall is.': 'Marshall Is.',
  
  'solomon islands': 'Solomon Is.',
  'solomonislands': 'Solomon Is.',
  'solomon is': 'Solomon Is.',
  'solomon is.': 'Solomon Is.',
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

// Modify the normalizeCountryName function to handle DR and DRC specifically
export function normalizeCountryName(name) {
  if (!name) return "";
  
  // Special handling for DRC with more comprehensive matching
  if (name.toLowerCase().includes("congo") && 
     (name.toLowerCase().includes("dr") || 
      name.toLowerCase().includes("dem") || 
      name.toLowerCase().includes("democratic"))) {
    
    // This is the EXACT format needed to match the GeoJSON data
    return "Dem. Rep. Congo";
  }
  
  // Handle just "DRC" as an abbreviation
  if (name.toLowerCase() === "drc") {
    return "Dem. Rep. Congo";
  }
  
  // Special handling for problematic countries
  if (name.toLowerCase().includes("dr") && name.toLowerCase().includes("congo")) {
    return "Dem. Rep. Congo";  // EXACT match with capitalization in GeoJSON
  }
  if (name.toLowerCase() === "dr" || (name.toLowerCase().includes("dominican") && name.toLowerCase().includes("rep"))) {
    return "dominicanrepublic";  // Standardized form for Dominican Republic
  }
  
  // Add special handling for Ivory Coast / Côte d'Ivoire
  if (name.toLowerCase().includes("ivory") || 
      name.toLowerCase().includes("ivoire") || 
      name.toLowerCase().includes("cote") || 
      name.toLowerCase().includes("côte")) {
    return "Côte d'Ivoire";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Bosnia and Herzegovina
  if (name.toLowerCase().includes("bosnia") || 
      name.toLowerCase().includes("herzegovina") || 
      name.toLowerCase().includes("herz")) {
    return "Bosnia and Herz.";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Czech Republic/Czechia variations
  if (name.toLowerCase().includes("czech") || 
      name.toLowerCase().includes("czechia") || 
      name.toLowerCase() === "chechia" || 
      name.toLowerCase() === "chech republic") {
    return "Czechia";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Guinea-Bissau
  if ((name.toLowerCase().includes("guinea") && name.toLowerCase().includes("bissau")) ||
      name.toLowerCase() === "guineabissau") {
    return "Guinea-Bissau";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Saint/St. countries at the beginning of normalizeCountryName
  
  // Handle Saint Vincent and the Grenadines variations
  if (name.toLowerCase().includes("vincent") || 
      (name.toLowerCase().includes("st") && name.toLowerCase().includes("vincent")) ||
      (name.toLowerCase().includes("saint") && name.toLowerCase().includes("vincent"))) {
    return "St. Vincent and the Grenadines";  // Exact GeoJSON format
  }

  // Handle Saint Lucia variations
  if (name.toLowerCase() === "st lucia" || 
      name.toLowerCase() === "st. lucia" || 
      name.toLowerCase() === "saint lucia" ||
      name.toLowerCase() === "stlucia" ||
      name.toLowerCase() === "saintlucia") {
    return "St. Lucia";  // Exact GeoJSON format
  }

  // Handle Saint Kitts and Nevis variations
  if (name.toLowerCase().includes("kitts") || 
      (name.toLowerCase().includes("st") && name.toLowerCase().includes("kitt")) ||
      (name.toLowerCase().includes("saint") && name.toLowerCase().includes("kitt"))) {
    return "St. Kitts and Nevis";  // Exact GeoJSON format
  }
  
  // Add special handling for São Tomé and Príncipe with all variations
  if (name.toLowerCase().includes("tome") || 
      name.toLowerCase().includes("tomé") || 
      name.toLowerCase().includes("principe") || 
      name.toLowerCase().includes("príncipe") || 
      name.toLowerCase().includes("sao tome") || 
      name.toLowerCase().includes("são tomé")) {
    return "São Tomé and Principe";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Equatorial Guinea
  if (name.toLowerCase().includes("equatorial") || 
      name.toLowerCase().includes("equatorialguinea") || 
      (name.toLowerCase().includes("eq") && name.toLowerCase().includes("guinea")) ||
      name.toLowerCase() === "eqguinea" || 
      name.toLowerCase() === "eq. guinea") {
    return "Eq. Guinea";  // Exact format used in GeoJSON
  }
  
  // Add special handling for South Sudan
  if (name.toLowerCase().includes("south sudan") || 
      name.toLowerCase() === "southsudan" || 
      name.toLowerCase() === "s sudan" || 
      name.toLowerCase() === "ssudan" || 
      name.toLowerCase() === "s. sudan") {
    return "S. Sudan";  // Exact format used in GeoJSON
  }

  // Special handling for Sudan to avoid confusion with South Sudan
  if (name.toLowerCase() === "sudan" && 
      !name.toLowerCase().includes("south")) {
    return "Sudan";  // Make sure regular Sudan is handled separately
  }
  
  // In the normalizeCountryName function, add a special case for Somalia/Somaliland
  if (name.toLowerCase() === "somalia" || name.toLowerCase() === "somaliland") {
    return "Somalia";  // Exact form in GeoJSON for the main country
  }
  
  // Special handling for Denmark/Greenland relationship
  if (name.toLowerCase() === "denmark") {
    return "Denmark";  // Exact match for the parent country
  }
  if (name.toLowerCase() === "greenland") {
    return "Greenland";  // Exact match for the territory
  }
  
  // Add special handling for Marshall Islands
  if (name.toLowerCase().includes("marshall") || 
      name.toLowerCase() === "marshallislands" || 
      name.toLowerCase() === "marshall islands" || 
      name.toLowerCase() === "marshall is" || 
      name.toLowerCase() === "marshall is.") {
    // Return the full name to match the recognized_countries.json format
    return "Marshall Islands";
  }

  // Add special handling for Solomon Islands
  if (name.toLowerCase().includes("solomon") || 
      name.toLowerCase() === "solomonislands" || 
      name.toLowerCase() === "solomon islands" || 
      name.toLowerCase() === "solomon is" || 
      name.toLowerCase() === "solomon is.") {
    // Return the full name to match the recognized_countries.json format
    return "Solomon Islands";
  }
  
  // Add special handling for Timor-Leste/East Timor variations
  if (name.toLowerCase().includes("timor") || 
      name.toLowerCase().includes("east timor") || 
      name.toLowerCase() === "timorleste" || 
      name.toLowerCase() === "timor-leste" || 
      name.toLowerCase() === "easttimor" || 
      name.toLowerCase() === "leste") {
    return "Timor-Leste";  // Exact format used in GeoJSON
  }
  
  // Add special handling for Myanmar/Burma
  if (name.toLowerCase() === "myanmar" || 
      name.toLowerCase() === "burma" || 
      name.toLowerCase().includes("myanmar") || 
      name.toLowerCase().includes("burma")) {
    return "Myanmar (Burma)";  // Exact format as it appears in recognized_countries.json
  }
  
  // Add special handling for Eswatini (formerly Swaziland)
  if (name.toLowerCase().includes("eswatini") || 
      name.toLowerCase().includes("swaziland") || 
      name.toLowerCase() === "swazi" || 
      name.toLowerCase() === "e swatini") {
    return "Eswatini (Swaziland)";  // Exact format as it appears in recognized_countries.json
  }
  
  // Add special handling for Republic of Congo (not to be confused with DR Congo)
  if ((name.toLowerCase().includes("republic") && name.toLowerCase().includes("congo") && 
       !name.toLowerCase().includes("democratic") && !name.toLowerCase().includes("dem")) || 
      name.toLowerCase() === "congo" || 
      name.toLowerCase() === "congobrazzaville" || 
      name.toLowerCase() === "congo brazzaville" || 
      name.toLowerCase() === "congo republic") {
    return "Republic of the Congo";  // Exact format as it appears in recognized_countries.json
  }
  
  // Continue with the existing normalization logic
  const normalized = name.trim().toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces, hyphens, and underscores
    .replace(/\s+/g, ''); // Remove spaces
  
  // Map of country aliases for consistent name matching
  const countryAliases = {
    // M countries
    "macedonia": "northmacedonia",
    "northmacedonia": "northmacedonia",
    "fyrom": "northmacedonia",
    "formerrepublicofmacedonia": "northmacedonia",
    "republiquedemacedoine": "northmacedonia",
    
    // Vatican
    "vatican": "vaticancity",
    "vaticancity": "vaticancity",
    "holysee": "vaticancity",
    "theholysee": "vaticancity",
    "vaticano": "vaticancity",
    
    // Antigua
    "antigua": "antiguaandbarbuda",
    "antiguaandbarbuda": "antiguaandbarbuda",
    "antiguabarbuda": "antiguaandbarbuda",
    
    // Cape Verde
    "capeverde": "caboverde",
    "caboverde": "caboverde",
    
    // Other problematic countries
    "sttomeprinc": "saotomeandprincipe",
    "sttomeandprincipe": "saotomeandprincipe",
    "saotome": "saotomeandprincipe",
    "saotomeandprincipe": "saotomeandprincipe",
    
    "republicofthekongo": "congorepublic",
    "congo": "congorepublic",
    "republicofcongo": "congorepublic",
    "congobrazzaville": "congorepublic",
    "congorepublic": "congorepublic",
    
    "drcongo": "Dem. Rep. Congo",
    "congodemocraticrepublic": "Dem. Rep. Congo",
    "democraticrepublicofthecongo": "Dem. Rep. Congo",
    "congokinshasa": "Dem. Rep. Congo",
    
    "saintvincentgrenadines": "stvincentandthegrenadines",
    "saintvincentandthegrenadines": "stvincentandthegrenadines",
    "stvincentandthegrenadines": "stvincentandthegrenadines",
    "stvincentgrenadines": "stvincentandthegrenadines",
    
    "saintkittsandnevis": "stkittsandnevis",
    "stkittsandnevis": "stkittsandnevis",
    "stkittsnevis": "stkittsandnevis",
    
    "centralafricanrep": "centralafricanrepublic",
    "centralafricanrepublic": "centralafricanrepublic",
    "car": "centralafricanrepublic",

    // Other commonly problematic countries
    "usa": "unitedstatesofamerica",
    "unitedstates": "unitedstatesofamerica",
    "america": "unitedstatesofamerica",
    "us": "unitedstatesofamerica",
    
    "uk": "unitedkingdom",
    "greatbritain": "unitedkingdom",
    "england": "unitedkingdom",
    
    // Add many more aliases here...
    "kazakhstan": "kazakhstan",
    "kazakstan": "kazakhstan", 
    "kazahstan": "kazakhstan",
    "khazakstan": "kazakhstan",
    "kazakhstani": "kazakhstan",
    "kazak": "kazakhstan",

    // Add UAE variants
    "uae": "unitedarabemirates",
    "united arab emirates": "unitedarabemirates",
    "unitedarabemirates": "unitedarabemirates",
    "emirates": "unitedarabemirates",
    "arab emirates": "unitedarabemirates",
    "united emirates": "unitedarabemirates",
  };
  
  // Check if we have an alias for this normalized name
  return countryAliases[normalized] || normalized;
}

// Helper function to get all territories for a country
export function getTerritoriesForCountry(countryName) {
  const normalized = countryName.trim().toLowerCase();
  
  // Special case: if the normalized name is "greenland", return only Greenland
  if (normalized === "greenland") {
    return ["Greenland"];
  }

  // Special case: if the normalized name is "denmark", explicitly return its territories
  if (normalized === "denmark") {
    return ["Greenland", "Faeroe Is."];
  }

  // Special case: if the normalized name is "united states" or variants, return US territories
  if (normalized === "united states" || normalized === "united states of america" || 
      normalized === "usa" || normalized === "us" || normalized === "america") {
    return ["puerto rico", "guam", "u.s. virgin is.", "n. mariana is.", "american samoa"];
  }

  // Special case for Somalia
  if (normalized === "somalia") {
    return ["Somaliland"];  // Use exact capitalization from GeoJSON
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
    return "Greenland";  // Use exact format for GeoJSON match
  }
  // Special handling: if user types "somaliland", it should return "Somalia"
  if (normalizedGuess === "somaliland") {
    return "Somalia";  // Return the parent country for the territory
  }
  // Special handling: if user types a US territory, return "United States of America"
  if (normalizedGuess === "puerto rico" || normalizedGuess === "guam" || 
      normalizedGuess === "us virgin islands" || normalizedGuess === "us virgin is" || 
      normalizedGuess === "u.s. virgin is." || normalizedGuess === "northern mariana islands" || 
      normalizedGuess === "n. mariana is." || normalizedGuess === "american samoa") {
    return "United States of America";
  }
  
  const key = Object.keys(territoryMap).find(
    k => k.toLowerCase() === normalizedGuess
  );
  return key ? territoryMap[key] : undefined;
} 