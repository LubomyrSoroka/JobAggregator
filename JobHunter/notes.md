# TODO
- Use a full screen window for Editing a search.
- The scrapers on the editing a search page should be dimmed if they are not enabled.
- GetJobMeta in ViewSearch.vue should be refactored. Should the APIs just return a meta key which is an array which displays what all the meta keys should be? There could be other approaches... 
- Should there be a Job class?
- In the stats tab, display salary info 
- The way the filters are saved in Search.vue is not ideal. It should be refactored.
- By the way I wrote the api, it should be impossibly to get 'week' or 'month' only 'weekly' or 'monthly'. Here:
"if (type === 'week' || type === 'weekly') return baseVal.map(value => value * 52);
    if (type === 'month' || type === 'monthly') return baseVal.map(value => value * 12);"


# DONE
- Refactor AllFilters to use v-for instead of manually listing each filter.