# TODO
- Use a full screen window for Editing a search.
- The scrapers on the editing a search page should be dimmed if they are not enabled.
- GetJobMeta in ViewSearch.vue should be refactored. Should the APIs just return a meta key which is an array which displays what all the meta keys should be? There could be other approaches... 
- Should there be a Job class?
- The way the filters are saved in Search.vue is not ideal. It should be refactored.
- By the way I wrote the api, it should be impossibly to get 'week' or 'month' only 'weekly' or 'monthly'. Here:
"if (type === 'week' || type === 'weekly') return baseVal.map(value => value * 52);
    if (type === 'month' || type === 'monthly') return baseVal.map(value => value * 12);"
- Check if sortJobs is working while using the AI Enhancer.
- Allow scrapers to yield arrays of jobs instead of a single job.
- FilterJobWithAI should check if there is a job with the same description, to avoid reprocessing the same description. 
- Should the height of each job card be the same? (Currently, I think this is only the case for cards on the same row)
- May want to keep only one of salary or salary estimate for the meta items to preserve space.
- Can experiment and add scrolling to each of the individual job cards. (would this make it more awkward to scroll the whole page?)
- Allow users to download the current data as JSON.
- Is the stats tab calculating based off the last search or all the data?
- Instead of tooltips can have the job title and company name be automatically rotating horizontally if they are too long. (This could look awkward)
- Need to use a color scheme instead of assigning constants as colors everywhere.
- Refactor: Should've made the up-arrow into a component.
- Searches and scrapers should be given ids.
- There is no need to have a {scraper_name}_parameters key in the local storage. It should just be part of the scraper object.

# DONE
- Refactor AllFilters to use v-for instead of manually listing each filter.
- In the stats tab, display salary info 
- Add tooltips to the job cards to display the full job title and company name.