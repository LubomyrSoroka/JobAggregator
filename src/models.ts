import Filter from "./components/Filter";

export class ScraperParameter {
    name: string;
    value: string;

    constructor(name: string = '', value: string = '') {
        this.name = name;
        this.value = value;
    }
}

export class ScraperConfig {
    scraperName: string;
    parameters: ScraperParameter[];
    enabled: boolean;

    constructor(scraperName: string = '', parameters: ScraperParameter[] = [], enabled: boolean = true) {
        this.scraperName = scraperName;
        this.parameters = parameters;
        this.enabled = enabled;
    }
}

export class SavedSearch {
    name: string;
    scraperParameters: ScraperConfig[];
    filters: Filter[];

    constructor(name: string = '', scraperParameters: ScraperConfig[] = [], filters: Filter[] = []) {
        this.name = name;
        this.scraperParameters = scraperParameters;
        this.filters = filters;
    }
}
