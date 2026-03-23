
export function parseNumeric(val: any): number[] | null {
    if (typeof val === 'number') return [val];
    if (!val || typeof val !== 'string') return null;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    if (cleaned.includes('-')) {
        const parts = cleaned.split('-').map(p => parseFloat(p)).filter(p => !isNaN(p));
        if (parts.length === 0) return null;
        return parts;
    }
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : [parsed];
}


export function calculateYearlySalary(job: any): number[] | null {
    const baseVal = parseNumeric(job.salaryRange);
    if (baseVal === null) return null;

    const type = (job.salaryType || '').toLowerCase();
    // 40 hours per week * 52 weeks per year = 2080 hours per year
    if (type === 'hourly') return baseVal.map((value: number) => value * 2080);
    if (type === 'week' || type === 'weekly') return baseVal.map((value: number) => value * 52);
    if (type === 'month' || type === 'monthly') return baseVal.map((value: number) => value * 12);
    return baseVal; // Assume yearly if unspecified or already yearly
}
