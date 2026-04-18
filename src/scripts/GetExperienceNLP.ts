export function getExperienceNLP(text: string): { "years of experience": number | null, "salary range": number[] | null, "salary type": string | null, text: string } {
    let maxYears = -Infinity
    let salaryRange: string | null = null;
    let salaryType: string | null = null;
    let salaryRangeArray: number[] | null = null;

    const wordToNum: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
    }
    const numOrWord = `\\d+(?:\\.\\d+)?|${Object.keys(wordToNum).join('|')}`
    //const numAndWord = Object.entries(wordToNum).reduce((acc, entry) => `${acc}|${entry[0]}\\s+(${entry[1]})`, '');
    const numAndWord = Object.entries(wordToNum).map(entry => `${entry[0]}\\s+\\(${entry[1]}\\)`).join('|');
    const dashes = [
        '-', '—', '–', '−', '‒', '―',
        '&mdash;?', '&ndash;?', '&minus;?',
        '&#8210;?', '&#8211;?', '&#8212;?', '&#8213;?', '&#8722;?', '&#45;?',
        '&#x2012;?', '&#x2013;?', '&#x2014;?', '&#x2015;?', '&#x2212;?'
    ].join('|');
    const wordsBetweenSalaries = [
        'to', 'up to', 'and'
    ].join('|');
    // Look for `<digit or word> years` (allows optional +, -, or 'to' ranges)
    // Supports: "5 years", "five+ years", "three to five years"
    const regexForward = new RegExp(`\\b(${numOrWord}|${numAndWord})\\s*(?:\\+|(?:${dashes}|to)\\s*(?:${numOrWord}|${numAndWord})\\+?)?\\s*(?:years?|yrs?)\\b`, 'gi')

    let match
    while ((match = regexForward.exec(text)) !== null) {
        if (match[1]) {
            const valStr = match[1].toLowerCase()
            const key = valStr.split(' ')[0] ?? ''
            const valNum = wordToNum[key] !== undefined ? wordToNum[key] : parseInt(valStr, 10)
            if (valNum < 20) {
                maxYears = Math.max(maxYears, valNum)
            }
        }
    }
    regexForward.lastIndex = 0
    text = text.replace(regexForward, '<b style="color: red;">$&</b>')

    // Look for salaries like $100k, $100k - $150k, $50/hr etc. Disqualify if followed by million or billion.
    // or 80 - 150k, then the 80 should be treated as 80k
    // need to account for text that may be bolded before hand... 
    // need to look for stuff like 150k/year to 180k/year
    // const salaryRegexStr = `(?:CAD?\\s*)?\\$\\d{1,3}(?:[,.]\\d+)*[kK]?(?!\\s*(?:million|billion|trillion))(?:\\s*CAD)?\\b(?:\\s*(?:${dashes}|(?:up)?\\s*to|and)\\s*(?:CAD?\\s*)?\\$?\\d{1,3}(?:[,.]\\d+)*[kK]?(?:\\s*CAD)?)?(?:\\s*(?:\\/|per)?\\s*(hr|hour|hourly|yr|year|yearly|mo|month|monthly|wk|week|weekly|annum|annually))?`;

    const salaryRegexStr =`(?:CA?D?\\s*)?\\$\\d{1,3}(?:[,. ]?\\d+)*[kK]?(?:\\s*CAD)?(?:\\s*(${dashes}|(?:up)?\\s*to|and)\\s*(?:CAD?\\s*)?\\$?\\d{1,3}(?:[,. ]?\\d+)*[kK]?(?:\\s*CA?D?)?)?(?:\\s*(?:\\/|per)?\\s*(hourly|hour|hr|yearly|year|yr|monthly|month|mo|weekly|week|wk|annually|annum))?`;

    // the following would allow stuff like "$100k -$150k per yearly" or "$100k - $150k year" which doesn't make sense but okay...
    // it isn't checking for the word between in case what's in between the salaries is "and"
    // backtracking makes it hard to use negative lookahead.

    const salaryRegex = new RegExp(salaryRegexStr, 'gi');
    let salaryMatch
    while (( salaryMatch = salaryRegex.exec(text) ) !== null) {
        // Skip matches followed by million/billion/trillion
        const afterMatch = text.slice(salaryMatch.index + salaryMatch[0].length).trimStart();
        if (/^(B\b|M\b|-?million|-?billion|-?trillion)/i.test(afterMatch)) continue;

        // Return the first found salary string
        salaryRange = salaryMatch[0];


        salaryRangeArray = salaryRange.split(new RegExp(dashes + '|' + wordsBetweenSalaries)).map(strValue => strValue.toLowerCase().includes('k') ? parseFloat( strValue.replace(/[^0-9.]/g, '')) * 1000 : parseFloat( strValue.replace(/[^0-9.]/g, '')));

        if (salaryMatch[2]) {
            const lowerCaseMatch = salaryMatch[2].toLowerCase();
            if (lowerCaseMatch == 'hr' || lowerCaseMatch == 'hour' || lowerCaseMatch == 'hourly'){
                // min wage is 15...
                if(salaryRangeArray[0] && salaryRangeArray[0] <= 10){
                    salaryRangeArray = null
                }
                else
                    salaryType = 'hourly';
            }
            else if (lowerCaseMatch == 'yr' || lowerCaseMatch == 'year' || lowerCaseMatch == 'yearly' || lowerCaseMatch == 'annum' || lowerCaseMatch == 'annually'){
                // if the value is too small, then disqualify it. E.g. "Health and wellness program up to $300/year"
                // could probably use a much bigger value than 300.
                if(salaryRangeArray[0] && salaryRangeArray[0] <= 300){
                    salaryRangeArray = null
                }
                else
                    salaryType = 'yearly';
            }
            else if (lowerCaseMatch == 'mo' || lowerCaseMatch == 'month' || lowerCaseMatch == 'monthly')
                salaryType = 'monthly';
            else if (lowerCaseMatch == 'wk' || lowerCaseMatch == 'week' || lowerCaseMatch == 'weekly')
                salaryType = 'weekly';
            // if we found a time period for the salary, then we can stop looking for more salaries
            // it's possible there is more than one time period, but we'll take the first one. And if they're not matching, then you could try to find the more "reasonable" one.
            //break;
        }
        else if (salaryRangeArray[0]) {
            if (salaryRangeArray[0] > 40000)
                salaryType = 'yearly';
            else
                salaryType = 'hourly';
        }
        if(salaryMatch[1]){ // if you found a dash or a connecting word, then use this salary as the final salary
            break;
        }
    }

    salaryRegex.lastIndex = 0;
    text = text.replace(salaryRegex, '<b style="color: red;">$&</b>');

    return {
        "years of experience": maxYears === -Infinity ? null : maxYears,
        "salary range": salaryRangeArray,
        "salary type": salaryType,
        text
    }
}