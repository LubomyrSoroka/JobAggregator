export function getExperienceNLP(text: string): { "years of experience": number | null, "salary range": string | null, "salary type": string | null, text: string } {
    let maxYears = -Infinity
    let salaryRange: string | null = null;
    let salaryType: string | null = null;

    const wordToNum: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
    }
    const numOrWord = `\\d+(?:\\.\\d+)?|${Object.keys(wordToNum).join('|')}`
    const dashes = [
        '-',
        '\\\\u2012', '\\\\u2013', '\\\\u2014', '\\\\u2015', '\\\\u2212',
        '&mdash;?', '&ndash;?', '&minus;?',
        '&#8210;?', '&#8211;?', '&#8212;?', '&#8213;?', '&#8722;?', '&#45;?',
        '&#x2012;?', '&#x2013;?', '&#x2014;?', '&#x2015;?', '&#x2212;?'
    ].join('|');
    // Look for `<digit or word> years` (allows optional +, -, or 'to' ranges)
    // Supports: "5 years", "five+ years", "three to five years"
    const regexForward = new RegExp(`\\b(${numOrWord})\\s*(?:\\+|(?:${dashes}|to)\\s*(?:${numOrWord})\\+?)?\\s*(?:years?|yrs?)\\b`, 'gi')
    let match
    while ((match = regexForward.exec(text)) !== null) {
        if (match[1]) {
            const valStr = match[1].toLowerCase()
            const valNum = wordToNum[valStr] !== undefined ? wordToNum[valStr] : parseInt(valStr, 10)
            if (valNum <= 20) {
                maxYears = Math.max(maxYears, valNum)
            }
        }
    }
    regexForward.lastIndex = 0
    text = text.replace(regexForward, '<b style="color: red;">$&</b>')

    // Look for salaries like $100k, $100k - $150k, $50/hr etc. Disqualify if followed by million or billion.
    const salaryRegexStr = `\\$\\d{1,3}(?:[,.]\\d+)*[kK]?(?!\\s*(?:million|billion|trillion))\\b(?:\\s*(?:${dashes}|to)\\s*\\$?\\d{1,3}(?:[,.]\\d+)*[kK]?)?(?:\\s*(?:\\/|per)\\s*(hr|hour|yr|year|mo|month|wk|week))?`;
    const salaryRegex = new RegExp(salaryRegexStr, 'gi');
    const salaryMatch = salaryRegex.exec(text);
    if (salaryMatch && salaryMatch.length > 0) {
        // Return the first found salary string
        salaryRange = salaryMatch[0];
        if (salaryMatch[1]) {
            if (salaryMatch[1] == 'hr' || salaryMatch[1] == 'hour')
                salaryType = 'hourly';
            else if (salaryMatch[1] == 'yr' || salaryMatch[1] == 'year')
                salaryType = 'yearly';
            else if (salaryMatch[1] == 'mo' || salaryMatch[1] == 'month')
                salaryType = 'monthly';
            else if (salaryMatch[1] == 'wk' || salaryMatch[1] == 'week')
                salaryType = 'weekly';
        }
        else {
            if (salaryMatch[0].includes('k') || salaryMatch[0].includes('K') || parseInt(salaryMatch[0].replace(/[^0-9]/g, '')) > 10000)
                salaryType = 'yearly';
            else
                salaryType = 'hourly';
        }
    }
    salaryRegex.lastIndex = 0;
    text = text.replace(salaryRegex, '<b style="color: red;">$&</b>');

    return {
        "years of experience": maxYears === -Infinity ? null : maxYears,
        "salary range": salaryRange,
        "salary type": salaryType,
        text
    }
}