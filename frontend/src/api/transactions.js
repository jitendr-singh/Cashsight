import API from './axios';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTransactions(params = {}) {
  const { data } = await API.get('/transactions', {
    headers: authHeaders(),
    params,
  });
  return data;
}

export async function fetchTransactionSummary() {
  const { data } = await API.get('/transactions/summary/all', {
    headers: authHeaders(),
  });
  return data;
}

export async function createTransaction(payload) {
  const { data } = await API.post('/transactions', payload, {
    headers: authHeaders(),
  });
  return data;
}

export async function updateTransaction(id, payload) {
  const { data } = await API.put(`/transactions/${id}`, payload, {
    headers: authHeaders(),
  });
  return data;
}

export async function deleteTransaction(id) {
  const { data } = await API.delete(`/transactions/${id}`, {
    headers: authHeaders(),
  });
  return data;
}
