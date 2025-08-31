export const endpoints = {
  analyticsSummary: ({ range, segment }) => `/api/analytics/summary?range=${encodeURIComponent(range)}&segment=${encodeURIComponent(segment)}`,
  analyticsRecommendations: ({ range, segment }) => `/api/analytics/recommendations?range=${encodeURIComponent(range)}&segment=${encodeURIComponent(segment)}`,
  analyticsTopProblems: ({ range, segment }) => `/api/analytics/top-problems?range=${encodeURIComponent(range)}&segment=${encodeURIComponent(segment)}`,
  analyticsProviders: () => `/api/analytics/providers`,
  analyticsCache: () => `/api/analytics/cache`,
  analyticsSimulate: () => `/api/analytics/simulate`,
  securityStats: () => `/api/security/stats`,

  settingsGet: () => `/api/settings`,
  settingsUpdate: () => `/api/settings/update`,

  pickupsList: () => `/api/pickups`,
  pickupById: (id) => `/api/pickups/${encodeURIComponent(id)}`,
};
