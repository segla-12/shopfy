export type PhoneCountry = {
  code: string;
  name: {
    fr: string;
    en: string;
  };
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  nationalLength?: number;
};

type PhoneCountrySeed = {
  code: string;
  dialCode: string;
  minLength?: number;
  maxLength?: number;
  nationalLength?: number;
  name?: {
    fr: string;
    en: string;
  };
};

const countryDisplayNames = {
  fr: new Intl.DisplayNames(["fr"], { type: "region" }),
  en: new Intl.DisplayNames(["en"], { type: "region" }),
};

const phoneCountrySeeds: PhoneCountrySeed[] = [
  { code: "AF", dialCode: "+93" },
  { code: "ZA", dialCode: "+27" },
  { code: "AL", dialCode: "+355" },
  { code: "DZ", dialCode: "+213" },
  { code: "DE", dialCode: "+49" },
  { code: "AD", dialCode: "+376" },
  { code: "AO", dialCode: "+244" },
  { code: "AI", dialCode: "+1264" },
  { code: "AG", dialCode: "+1268" },
  { code: "SA", dialCode: "+966" },
  { code: "AR", dialCode: "+54" },
  { code: "AM", dialCode: "+374" },
  { code: "AW", dialCode: "+297" },
  { code: "AU", dialCode: "+61" },
  { code: "AT", dialCode: "+43" },
  { code: "AZ", dialCode: "+994" },
  { code: "BS", dialCode: "+1242" },
  { code: "BH", dialCode: "+973" },
  { code: "BD", dialCode: "+880" },
  { code: "BB", dialCode: "+1246" },
  { code: "BE", dialCode: "+32" },
  { code: "BZ", dialCode: "+501" },
  { code: "BJ", dialCode: "+229", nationalLength: 10 },
  { code: "BM", dialCode: "+1441" },
  { code: "BT", dialCode: "+975" },
  { code: "BY", dialCode: "+375" },
  { code: "BO", dialCode: "+591" },
  { code: "BA", dialCode: "+387" },
  { code: "BW", dialCode: "+267" },
  { code: "BR", dialCode: "+55" },
  { code: "BN", dialCode: "+673" },
  { code: "BG", dialCode: "+359" },
  { code: "BF", dialCode: "+226", nationalLength: 8 },
  { code: "BI", dialCode: "+257" },
  { code: "KH", dialCode: "+855" },
  { code: "CM", dialCode: "+237" },
  { code: "CA", dialCode: "+1" },
  { code: "CV", dialCode: "+238" },
  { code: "CL", dialCode: "+56" },
  { code: "CN", dialCode: "+86" },
  { code: "CY", dialCode: "+357" },
  { code: "CO", dialCode: "+57" },
  { code: "KM", dialCode: "+269" },
  { code: "CG", dialCode: "+242" },
  { code: "CD", dialCode: "+243" },
  { code: "KR", dialCode: "+82" },
  { code: "KP", dialCode: "+850" },
  { code: "CR", dialCode: "+506" },
  { code: "CI", dialCode: "+225", nationalLength: 10 },
  { code: "HR", dialCode: "+385" },
  { code: "CU", dialCode: "+53" },
  { code: "CW", dialCode: "+599" },
  { code: "DK", dialCode: "+45" },
  { code: "DJ", dialCode: "+253" },
  { code: "DM", dialCode: "+1767" },
  { code: "EG", dialCode: "+20" },
  { code: "AE", dialCode: "+971" },
  { code: "EC", dialCode: "+593" },
  { code: "ER", dialCode: "+291" },
  { code: "ES", dialCode: "+34" },
  { code: "EE", dialCode: "+372" },
  { code: "SZ", dialCode: "+268" },
  { code: "US", dialCode: "+1" },
  { code: "ET", dialCode: "+251" },
  { code: "FJ", dialCode: "+679" },
  { code: "FI", dialCode: "+358" },
  { code: "FR", dialCode: "+33" },
  { code: "GA", dialCode: "+241" },
  { code: "GM", dialCode: "+220" },
  { code: "GE", dialCode: "+995" },
  { code: "GH", dialCode: "+233", nationalLength: 9 },
  { code: "GI", dialCode: "+350" },
  { code: "GR", dialCode: "+30" },
  { code: "GD", dialCode: "+1473" },
  { code: "GL", dialCode: "+299" },
  { code: "GP", dialCode: "+590" },
  { code: "GU", dialCode: "+1671" },
  { code: "GT", dialCode: "+502" },
  { code: "GG", dialCode: "+44" },
  { code: "GN", dialCode: "+224" },
  { code: "GQ", dialCode: "+240" },
  { code: "GW", dialCode: "+245" },
  { code: "GY", dialCode: "+592" },
  { code: "GF", dialCode: "+594" },
  { code: "HT", dialCode: "+509" },
  { code: "HN", dialCode: "+504" },
  { code: "HK", dialCode: "+852" },
  { code: "HU", dialCode: "+36" },
  { code: "BV", dialCode: "+47" },
  { code: "CX", dialCode: "+61" },
  { code: "NF", dialCode: "+672" },
  { code: "KY", dialCode: "+1345" },
  { code: "CC", dialCode: "+61" },
  { code: "CK", dialCode: "+682" },
  { code: "FO", dialCode: "+298" },
  { code: "FK", dialCode: "+500" },
  { code: "MP", dialCode: "+1670" },
  { code: "MH", dialCode: "+692" },
  { code: "UM", dialCode: "+1" },
  { code: "PN", dialCode: "+64" },
  { code: "SB", dialCode: "+677" },
  { code: "TC", dialCode: "+1649" },
  { code: "VG", dialCode: "+1284" },
  { code: "VI", dialCode: "+1340" },
  { code: "IN", dialCode: "+91" },
  { code: "ID", dialCode: "+62" },
  { code: "IQ", dialCode: "+964" },
  { code: "IR", dialCode: "+98" },
  { code: "IE", dialCode: "+353" },
  { code: "IS", dialCode: "+354" },
  { code: "IL", dialCode: "+972" },
  { code: "IT", dialCode: "+39" },
  { code: "JM", dialCode: "+1876" },
  { code: "JP", dialCode: "+81" },
  { code: "JE", dialCode: "+44" },
  { code: "JO", dialCode: "+962" },
  { code: "KZ", dialCode: "+7" },
  { code: "KE", dialCode: "+254" },
  { code: "KG", dialCode: "+996" },
  { code: "KI", dialCode: "+686" },
  { code: "XK", dialCode: "+383", name: { fr: "Kosovo", en: "Kosovo" } },
  { code: "KW", dialCode: "+965" },
  { code: "LA", dialCode: "+856" },
  { code: "LS", dialCode: "+266" },
  { code: "LV", dialCode: "+371" },
  { code: "LB", dialCode: "+961" },
  { code: "LR", dialCode: "+231" },
  { code: "LY", dialCode: "+218" },
  { code: "LI", dialCode: "+423" },
  { code: "LT", dialCode: "+370" },
  { code: "LU", dialCode: "+352" },
  { code: "MO", dialCode: "+853" },
  { code: "MG", dialCode: "+261" },
  { code: "MY", dialCode: "+60" },
  { code: "MW", dialCode: "+265" },
  { code: "MV", dialCode: "+960" },
  { code: "ML", dialCode: "+223", nationalLength: 8 },
  { code: "MT", dialCode: "+356" },
  { code: "MA", dialCode: "+212" },
  { code: "MQ", dialCode: "+596" },
  { code: "MU", dialCode: "+230" },
  { code: "MR", dialCode: "+222" },
  { code: "YT", dialCode: "+262" },
  { code: "MX", dialCode: "+52" },
  { code: "FM", dialCode: "+691" },
  { code: "MD", dialCode: "+373" },
  { code: "MC", dialCode: "+377" },
  { code: "MN", dialCode: "+976" },
  { code: "ME", dialCode: "+382" },
  { code: "MS", dialCode: "+1664" },
  { code: "MZ", dialCode: "+258" },
  { code: "MM", dialCode: "+95" },
  { code: "NA", dialCode: "+264" },
  { code: "NR", dialCode: "+674" },
  { code: "NP", dialCode: "+977" },
  { code: "NI", dialCode: "+505" },
  { code: "NE", dialCode: "+227", nationalLength: 8 },
  { code: "NG", dialCode: "+234", nationalLength: 10 },
  { code: "NU", dialCode: "+683" },
  { code: "NO", dialCode: "+47" },
  { code: "NC", dialCode: "+687" },
  { code: "NZ", dialCode: "+64" },
  { code: "OM", dialCode: "+968" },
  { code: "UG", dialCode: "+256" },
  { code: "UZ", dialCode: "+998" },
  { code: "PK", dialCode: "+92" },
  { code: "PW", dialCode: "+680" },
  { code: "PS", dialCode: "+970" },
  { code: "PA", dialCode: "+507" },
  { code: "PG", dialCode: "+675" },
  { code: "PY", dialCode: "+595" },
  { code: "NL", dialCode: "+31" },
  { code: "PE", dialCode: "+51" },
  { code: "PH", dialCode: "+63" },
  { code: "PL", dialCode: "+48" },
  { code: "PF", dialCode: "+689" },
  { code: "PR", dialCode: "+1787" },
  { code: "PT", dialCode: "+351" },
  { code: "QA", dialCode: "+974" },
  { code: "CF", dialCode: "+236" },
  { code: "DO", dialCode: "+1809" },
  { code: "RE", dialCode: "+262" },
  { code: "RO", dialCode: "+40" },
  { code: "GB", dialCode: "+44" },
  { code: "RU", dialCode: "+7" },
  { code: "RW", dialCode: "+250" },
  { code: "EH", dialCode: "+212" },
  { code: "BL", dialCode: "+590" },
  { code: "KN", dialCode: "+1869" },
  { code: "SM", dialCode: "+378" },
  { code: "MF", dialCode: "+590" },
  { code: "SX", dialCode: "+1721" },
  { code: "PM", dialCode: "+508" },
  { code: "VC", dialCode: "+1784" },
  { code: "SH", dialCode: "+290" },
  { code: "LC", dialCode: "+1758" },
  { code: "SV", dialCode: "+503" },
  { code: "WS", dialCode: "+685" },
  { code: "AS", dialCode: "+1684" },
  { code: "ST", dialCode: "+239" },
  { code: "SN", dialCode: "+221", nationalLength: 9 },
  { code: "RS", dialCode: "+381" },
  { code: "SC", dialCode: "+248" },
  { code: "SL", dialCode: "+232" },
  { code: "SG", dialCode: "+65" },
  { code: "SK", dialCode: "+421" },
  { code: "SI", dialCode: "+386" },
  { code: "SO", dialCode: "+252" },
  { code: "SD", dialCode: "+249" },
  { code: "SS", dialCode: "+211" },
  { code: "LK", dialCode: "+94" },
  { code: "SE", dialCode: "+46" },
  { code: "CH", dialCode: "+41" },
  { code: "SR", dialCode: "+597" },
  { code: "SJ", dialCode: "+47" },
  { code: "SY", dialCode: "+963" },
  { code: "TJ", dialCode: "+992" },
  { code: "TW", dialCode: "+886" },
  { code: "TZ", dialCode: "+255" },
  { code: "TD", dialCode: "+235" },
  { code: "CZ", dialCode: "+420" },
  { code: "TF", dialCode: "+262" },
  { code: "IO", dialCode: "+246" },
  { code: "TH", dialCode: "+66" },
  { code: "TL", dialCode: "+670" },
  { code: "TG", dialCode: "+228", nationalLength: 8 },
  { code: "TK", dialCode: "+690" },
  { code: "TO", dialCode: "+676" },
  { code: "TT", dialCode: "+1868" },
  { code: "TN", dialCode: "+216" },
  { code: "TM", dialCode: "+993" },
  { code: "TR", dialCode: "+90" },
  { code: "TV", dialCode: "+688" },
  { code: "UA", dialCode: "+380" },
  { code: "UY", dialCode: "+598" },
  { code: "VU", dialCode: "+678" },
  { code: "VA", dialCode: "+379" },
  { code: "VE", dialCode: "+58" },
  { code: "VN", dialCode: "+84" },
  { code: "WF", dialCode: "+681" },
  { code: "YE", dialCode: "+967" },
  { code: "ZM", dialCode: "+260" },
  { code: "ZW", dialCode: "+263" },
  { code: "AX", dialCode: "+358" },
  { code: "IM", dialCode: "+44" },
  { code: "BQ", dialCode: "+599" },
  { code: "MK", dialCode: "+389" },
];

export const phoneCountries: PhoneCountry[] = phoneCountrySeeds
  .map(createPhoneCountry)
  .sort((firstCountry, secondCountry) => firstCountry.name.fr.localeCompare(secondCountry.name.fr, "fr"));

export function getPhoneCountry(code: string) {
  return phoneCountries.find((country) => country.code === code) || null;
}

export function getPhoneCountryByDialCode(phone: string) {
  const normalizedPhone = phone.replace(/\s/g, "");

  return [...phoneCountries]
    .sort((firstCountry, secondCountry) => secondCountry.dialCode.length - firstCountry.dialCode.length)
    .find((country) => normalizedPhone.startsWith(country.dialCode)) || null;
}

export function getNationalNumberBounds(country: PhoneCountry) {
  if (country.nationalLength) {
    return {
      min: country.nationalLength,
      max: country.nationalLength,
    };
  }

  return {
    min: country.minLength,
    max: country.maxLength,
  };
}

export function buildInternationalPhone(country: PhoneCountry | null, nationalNumber: string) {
  if (!country) {
    return "";
  }

  const bounds = getNationalNumberBounds(country);

  if (nationalNumber.length < bounds.min || nationalNumber.length > bounds.max) {
    return "";
  }

  return `${country.dialCode}${nationalNumber}`;
}

function createPhoneCountry(seed: PhoneCountrySeed): PhoneCountry {
  const maxLength = seed.nationalLength || seed.maxLength || getDefaultMaxLength(seed.dialCode);

  return {
    code: seed.code,
    name: seed.name || {
      fr: countryDisplayNames.fr.of(seed.code) || seed.code,
      en: countryDisplayNames.en.of(seed.code) || seed.code,
    },
    flag: getFlagEmoji(seed.code),
    dialCode: seed.dialCode,
    minLength: seed.nationalLength || seed.minLength || 4,
    maxLength,
    nationalLength: seed.nationalLength,
  };
}

function getDefaultMaxLength(dialCode: string) {
  const dialCodeLength = dialCode.replace(/\D/g, "").length;
  return Math.max(4, 15 - dialCodeLength);
}

function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}
