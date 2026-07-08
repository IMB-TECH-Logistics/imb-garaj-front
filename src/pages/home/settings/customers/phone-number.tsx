export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "-";
    
    const digits = phone.replace(/\D/g, '');
    // Only strip the 998 country code when it's actually a 12-digit number —
    // a 9-digit local number can legitimately start with "99" (operator code).
    const cleanDigits =
        digits.length === 12 && digits.startsWith('998')
            ? digits.substring(3)
            : digits;
    if (cleanDigits.length !== 9) return phone;
    return `+998 ${cleanDigits.substring(0, 2)} ${cleanDigits.substring(2, 5)} ${cleanDigits.substring(5, 7)} ${cleanDigits.substring(7, 9)}`;
};