/**
 * Nationalities, as the demonym a student would write ("Nepali", not "Nepal")
 * — that is how the field has always been stored.
 *
 * The countries Ignition's students actually come from lead the list; the
 * rest follow alphabetically.
 */
const COMMON = ["Nepali", "Indian", "Bangladeshi", "Sri Lankan", "Pakistani", "Bhutanese"];

const OTHERS = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguan", "Argentine",
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Barbadian",
  "Belarusian", "Belgian", "Belizean", "Beninese", "Bolivian", "Bosnian", "Botswanan", "Brazilian",
  "British", "Bruneian", "Bulgarian", "Burkinabé", "Burmese", "Burundian", "Cambodian", "Cameroonian",
  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian",
  "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish",
  "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorian", "Egyptian", "Emirati",
  "Equatorial Guinean", "Eritrean", "Estonian", "Eswatini", "Ethiopian", "Fijian", "Filipino",
  "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian",
  "Guatemalan", "Guinean", "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indonesian",
  "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian",
  "Kazakh", "Kenyan", "Kiribati", "Kosovar", "Kuwaiti", "Kyrgyz", "Lao", "Latvian", "Lebanese",
  "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourgish", "Malagasy", "Malawian",
  "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican",
  "Micronesian", "Moldovan", "Monégasque", "Mongolian", "Montenegrin", "Moroccan", "Mozambican",
  "Namibian", "Nauruan", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean",
  "North Macedonian", "Norwegian", "Omani", "Palauan", "Palestinian", "Panamanian",
  "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian",
  "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "Saudi", "Senegalese", "Serbian",
  "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Solomon Islander", "Somali",
  "South African", "South Korean", "South Sudanese", "Spanish", "Sudanese", "Surinamese", "Swedish",
  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian",
  "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek",
  "Vanuatuan", "Venezuelan", "Vietnamese", "Yemeni", "Zambian", "Zimbabwean",
];

export const NATIONALITIES = [...COMMON, ...OTHERS];

/** The list, plus a stored value it does not contain, so a saved answer still shows. */
export const nationalityOptions = (current) => {
  const value = String(current ?? "").trim();
  if (!value || NATIONALITIES.some((option) => option.toLowerCase() === value.toLowerCase())) {
    return NATIONALITIES;
  }
  return [value, ...NATIONALITIES];
};
