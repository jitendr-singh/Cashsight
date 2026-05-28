import API from './axios';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAnalyticsSummary() {
  const { data } = await API.get('/analytics/summary', {
    headers: authHeaders(),
  });
  return data;
}

export async function fetchAnalyticsByCategory() {
  const { data } = await API.get('/analytics/by-category', {
    headers: authHeaders(),
  });
  return data;
}

export async function fetchAnalyticsMonthlyTrend() {
  const { data } = await API.get('/analytics/monthly-trend', {
    headers: authHeaders(),
  });
  return data.monthly_trend || [];
}

export async function fetchAnalyticsRecent() {
  const { data } = await API.get('/analytics/recent', {
    headers: authHeaders(),
  });
  return data.recent_transactions || [];
}

