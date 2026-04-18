# TODO
- (Maybe this was a better idea... but instead I allowed the user to click the checkbox staright on the card) The scrapers on the editing a search page should be dimmed if they are not enabled.
- GetJobMeta in ViewSearch.vue should be refactored. Should the APIs just return a meta key which is an array which displays what all the meta keys should be? There could be other approaches... 
- Should there be a Job class?
- The way the filters are saved in Search.vue is not ideal. It should be refactored.
- By the way I wrote the api, it should be impossibly to get 'week' or 'month' only 'weekly' or 'monthly'. Here:
"if (type === 'week' || type === 'weekly') return baseVal.map(value => value * 52);
    if (type === 'month' || type === 'monthly') return baseVal.map(value => value * 12);"
- Check if sortJobs is working while using the AI Enhancer.
- FilterJobWithAI should check if there is a job with the same description, to avoid reprocessing the same description. 
- Should the height of each job card be the same? (Currently, I think this is only the case for cards on the same row)
- May want to keep only one of salary or salary estimate for the meta items to preserve space.
- Can experiment and add scrolling to each of the individual job cards. (would this make it more awkward to scroll the whole page?)
- Is the stats tab calculating based off the last search or all the data?
- Instead of tooltips can have the job title and company name be automatically rotating horizontally if they are too long. (This could look awkward)
- Need to use a color scheme instead of assigning constants as colors everywhere.
- Refactor: Should've made the up-arrow into a component.
- Searches and scrapers should be given ids.
- There is no need to have a {scraper_name}_parameters key in the local storage. It should just be part of the scraper object.
- Show a temporary message in the bottom right corner when you save something.
- Should have "Run and Save" and "Run" buttons on the Edit Search page.
- The blue highlight when selecting an input is slightly cut off on the Edit Search page.
- **Need to mention that scrapers should try to throw the errors otherwise viewsearch may have no way of knowing there was an error. i.e. don't handle the error in the scraper.** 
- If you try to switch between different cards for a stacked card while a scraper is processing, it will just take you back to the first card every time a new job is found.
- The view-search page should display the name of the search.
- When finding salaries with the LLM, for a range like "50 - 70 per hour", it should be displayed as $50.00 - $70.00 hourly. For some reason, it's replacing the - with a comma.
- It doesn't recognize that the k at the end of a salary means thousand. e.g. 100k should be 100,000.
- For finding years it still doesn't always give me the lower bound for the range. e.g for 2-3 years of experience it gives 3 instead of 2.
- Could seriously consider forcing jobs to have an id. Would definitely simplify some of the logic.
- Allow users to run a search even if they are creating one (don't just show the save search button).
- Bug: clicking save search when creating a new search would create duplicates if you click it more than once
- Names are being cut off by displaying the scraper being used for the job.
- OpenAI API config should not get auto-saved. It should be saved when the user clicks the save button.
- The look of the add search screen when there are no scrapers should be improved
- When switching between scrapers on EditSearch, scroll up to the top of the parameters section.
- Allow searching and combining multiple terms from one scraper for one search
- Highlighting text should not trigger a click on a job card.
- if you match the id of an existing job, then the job should use the newest description (if it's even different)
- Add a copy description button?
- Improve LinkedIn Scraper (apply should go to the apply link from the Linked Page and not just the LinkedIn page itself. Getting website of the company would require going to the company info page...)
- reloading the page should just set view last search to true? (not sure that this is a good idea)
- improve this: 
    // both of these are assuming that the names are unique (which they are not necessarily. Only the ids are)
    const scraperSourceToIcon: Record<string, string> = {};
    const scraperLinkTemplates = ref<Record<string, string>>({})

- The scraper icon does not look centered within the scraper-count css thing in ViewSearch.vue.
- When updating things in the backend, see if you can update just one thing instead of the entire thing. E.g., if you click "save" on a job, then just update the saved status of that job instead of updating the entire jobs array.

# DONE
- Refactor AllFilters to use v-for instead of manually listing each filter.
- In the stats tab, display salary info 
- Add tooltips to the job cards to display the full job title and company name.
- Use a full screen window for Editing a search.
- Allow scrapers to yield arrays of jobs instead of a single job.
- Allow grouping jobs by date.
- Can only store 5mb in localstorage. Best way around this is to just make a backend. I've never seen a job description mention IndexedDb...
- Allow users to download the current data as JSON.