export const filters = $state({
  search: '',
  membresOnly: false,
  selectedActivities: (() => {
    try {
      const stored = localStorage.getItem('pegass_activity_filter');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })()
});
