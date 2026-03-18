import { ref } from "vue";

class Filter {
    name: string = '';
    value: boolean = false;
    outputs: string[] = [];
    prompt: string = '';
    exampleJson: any = {};

    // constructor(name: string, value: boolean, outputs: string[], prompt: string, exampleJson: any) {
    //     this.name = name;
    //     this.value = value;
    //     this.outputs = outputs;
    //     this.prompt = prompt;
    //     this.exampleJson = exampleJson;
    // }
}
const filters: Filter[] = [
    {
        name: 'getMissingYearsOfExperience',
        value: false,
        outputs: ['yearsOfExperience', "requirementsSummary"],
        prompt: `How many years of experience are required or preferred. If the description gives a range of years of experience (e.g. 3-5 years), return the lower bound of the range (3 in this case).
                If there are multiple different requirements for years of experience, return the highest value. (E.g. 2-3 years in Python and 1 year in QA then return 2)
                You may output decimal values for years of experience. For example, if a job asks for 6 months of experience, then return 0.5.
                If no specific number is mentioned, return "not specified".
                Return a short summary of the requirements of the role in the "requirementsSummary" key. Include data about the years of experience expected for the most important technologies or frameworks of the job.`,
        exampleJson: {
            "yearsOfExperience": 2,
            "requirementsSummary": "The job requires 2-3 years in Python and 1 year in QA. Knowledge of React Native is considered an asset. etc."
        }

    },
    {
        name: 'getMissingSalary',
        value: false,
        outputs: ['salaryRange', 'salaryType'],
        prompt: `The salary range of the job. If the description gives a range of salary (e.g. $100,000-$120,000), return the whole range as a string. If it gives a single number, return that number as a string.
                For the salary type, if the salary type is weekly, return "weekly" if the salary type is hourly, return "hourly" if the salary type is yearly, return "yearly" and if it is none of the above, return null.
                If no specific number is mentioned, return "salaryRange" as "not specified" and "salaryType" as null.`,
        exampleJson: {
            "salaryRange": "$100,000-$120,000",
            "salaryType": "yearly"
        }
    },
    {
        name: 'getKeywords',
        value: false,
        outputs: ['keywords'],
        prompt: `The keywords of the job. Return a list of keywords that are mentioned in the job description.`,
        exampleJson: {
            "keywords": ["Python", "React Native", "QA"]
        }
    },
    {
        name: 'requiresSchoolEnrollment',
        value: false,
        outputs: ['requiresSchoolEnrollment'],
        prompt: `The school enrollment requirement of the job. If the description mentions that the job requires you to currently be enrolled in school, return true. Otherwise, return false.`,
        exampleJson: {
            "requiresSchoolEnrollment": false
        }
    },
    {
        name: 'prefersLocalCandidates',
        value: false,
        outputs: ['prefersLocalCandidates'],
        prompt: `The local candidate preference of the job. If the description mentions that the job prefers local candidates, return true. Otherwise, return false.`,
        exampleJson: {
            "prefersLocalCandidates": false
        }
    },
]
export default Filter;
export { filters };