const AZ_COUNTRY_CODE = "994";
const AZ_LOCAL_PHONE_LENGTH = 9;

export const AZ_MOBILE_PREFIXES = ["10", "50", "51", "55", "60", "70", "77", "99"] as const;

export const extractAzLocalDigits = (value: string) => {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (digits.startsWith(AZ_COUNTRY_CODE)) {
        return digits.slice(AZ_COUNTRY_CODE.length, AZ_COUNTRY_CODE.length + AZ_LOCAL_PHONE_LENGTH);
    }

    if (digits.startsWith("0")) {
        return digits.slice(1, 1 + AZ_LOCAL_PHONE_LENGTH);
    }

    return digits.slice(0, AZ_LOCAL_PHONE_LENGTH);
};

export const isAzMobilePrefix = (localDigits: string) =>
    AZ_MOBILE_PREFIXES.some((prefix) => localDigits.startsWith(prefix));

export const isPartialAzMobilePrefix = (localDigits: string) => {
    if (localDigits.length === 0) return true;
    if (localDigits.length === 1) return AZ_MOBILE_PREFIXES.some((prefix) => prefix.startsWith(localDigits));
    return isAzMobilePrefix(localDigits);
};

export const isCompleteAzMobile = (value: string) => {
    const localDigits = extractAzLocalDigits(value);
    return localDigits.length === AZ_LOCAL_PHONE_LENGTH && isAzMobilePrefix(localDigits);
};

export const toAzMobileE164 = (value: string) => {
    const localDigits = extractAzLocalDigits(value);
    return localDigits.length === AZ_LOCAL_PHONE_LENGTH ? `+${AZ_COUNTRY_CODE}${localDigits}` : "";
};

export const AZ_PHONE_PREFIX = "+994 (";

/** Renders local digits as "+994 (50) 123 45 67", closing each group as it fills. */
export const formatAzPhone = (value: string) => {
    const localDigits = extractAzLocalDigits(value);
    if (!localDigits) return "";

    const operator = localDigits.slice(0, 2);
    const groups = [localDigits.slice(2, 5), localDigits.slice(5, 7), localDigits.slice(7, 9)];

    let formatted = `${AZ_PHONE_PREFIX}${operator}`;
    if (operator.length === 2) {
        formatted += ")";
    }

    for (const group of groups) {
        if (!group) break;
        formatted += ` ${group}`;
    }

    return formatted;
};

export const azPhoneOnFocus = (value: string) =>
    extractAzLocalDigits(value) ? value : AZ_PHONE_PREFIX;

export const azPhoneOnBlur = (value: string) =>
    extractAzLocalDigits(value) ? value : "";
