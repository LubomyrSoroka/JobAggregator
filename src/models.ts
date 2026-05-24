import Filter from "./components/Filter";

export type ScraperParameter = Record<string, string>;

export class ScraperConfig {
    scraperId: number;
    parameters: ScraperParameter;
    enabled: boolean;

    constructor(scraperId: number = 0, parameters: ScraperParameter = {}, enabled: boolean = true) {
        this.scraperId = scraperId;
        this.parameters = parameters;
        this.enabled = enabled;
    }
}


export class SavedSearch {
    id: number| undefined;
    name: string;
    privateScraperConfigs: Record<number, ScraperConfig>;
    publicScraperConfigs: Record<number, ScraperConfig>;
    filters: Filter[];

    constructor(name: string = '', privateScraperConfigs: Record<number, ScraperConfig> = {}, publicScraperConfigs: Record<number, ScraperConfig> = {}, filters: Filter[] = []) {
        this.name = name;
        this.privateScraperConfigs = privateScraperConfigs;
        this.publicScraperConfigs = publicScraperConfigs;
        this.filters = filters;
        this.id = undefined;
    }
}
