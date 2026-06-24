// Capitallens API Client with Mockup Fallbacks

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token Management Helpers
const getAuthToken = () => localStorage.getItem('capitallens_token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('capitallens_token', token);
  } else {
    localStorage.removeItem('capitallens_token');
  }
};

let unauthorizedCallback = null;
export const setUnauthorizedCallback = (cb) => {
  unauthorizedCallback = cb;
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const parseErrorResponse = async (response) => {
  let errMsg = 'API Request Failed';
  try {
    const text = await response.text();
    if (text) {
      errMsg = text;
      try {
        const data = JSON.parse(text);
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errMsg = data.detail.map(d => {
              let msg = d.msg || '';
              if (msg.startsWith('Value error, ')) {
                msg = msg.substring('Value error, '.length);
              }
              if (msg.includes('value is not a valid email address')) {
                return 'Please provide a valid email address';
              }
              return msg;
            }).join(', ');
          }
        }
      } catch (_) {
        // Not a JSON string, keep raw text
      }
    }
  } catch (err) {
    console.error('Error reading response body:', err);
  }
  return errMsg;
};

// Generic Fetch Wrapper with Fallback Support
async function request(endpoint, options = {}, mockData = null) {
  // Abort after custom timeout or default to 60s to prevent hanging indefinitely (live yfinance fetches can take 5-10s)
  const timeoutMs = options.timeout || 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Extract timeout option to prevent forwarding it to fetch
  const { timeout, ...fetchOptions } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...getHeaders(),
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Automatic logout on unauthorized
      setAuthToken(null);
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }

    if (!response.ok) {
      const errMsg = await parseErrorResponse(response);
      throw new Error(errMsg);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[API Client Warning] Failed fetching ${endpoint}, using high-fidelity mockup data.`, error);
    if (mockData !== null) {
      return mockData;
    }
    throw error;
  }
}


// ─── AUTH SERVICES ──────────────────────────────────────────────────────────
export const authService = {
  login: async (username, password) => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 60000);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      clearTimeout(tid);

      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        throw new Error(errMsg);
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      return data;
    } catch (error) {
      clearTimeout(tid);
      if (error.name === 'AbortError') {
        throw new Error('Connection timed out. Please ensure the backend server is running.');
      }
      throw error;
    }
  },

  register: async (name, email, password) => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      clearTimeout(tid);

      if (!response.ok) {
        const errMsg = await parseErrorResponse(response);
        throw new Error(errMsg);
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      return data;
    } catch (error) {
      clearTimeout(tid);
      if (error.name === 'AbortError') {
        throw new Error('Connection timed out. Please ensure the backend server is running.');
      }
      throw error;
    }
  },

  getCurrentUser: async () => {
    return request('/users/me', {}, null);
  },

  updateProfile: async ({ name, email }) => {
    return request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, email }),
    }, null);
  },

  changePassword: async ({ current_password, new_password }) => {
    return request('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }, null);
  },

  logout: () => {
    setAuthToken(null);
  }
};


// ─── ANALYTICS SERVICES ──────────────────────────────────────────────────────
export const analyticsService = {
  getSummary: async () => {
    return request('/analytics/summary', {}, null);
  },

  getRangeData: async (filters = {}) => {
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        cleanFilters[key] = filters[key];
      }
    });
    const params = new URLSearchParams(cleanFilters).toString();

    // High-Fidelity dynamic fallback mockup data based on selected parameters
    const viewMode = filters.view_mode || 'month';
    const mockData = {
      view_mode: viewMode,
      labels: [],
      income: [],
      expense: [],
      savings: [],
      summary: { total_income: 0, total_expense: 0, total_savings: 0, savings_rate: 0 }
    };

    // Deterministic random generator based on index to keep curves looking natural
    const getValue = (seed, index) => {
      const x = Math.sin(seed + index) * 10000;
      return Math.round((x - Math.floor(x)) * 500 + 100);
    };

    if (viewMode === 'day') {
      const year = filters.year || 2026;
      const month = filters.month || 6;
      const totalDays = new Date(year, month, 0).getDate();

      for (let d = 1; d <= totalDays; d++) {
        mockData.labels.push(String(d));
        const inc = getValue(42, d);
        const exp = getValue(17, d);
        mockData.income.push(inc);
        mockData.expense.push(exp);
        mockData.savings.push(inc - exp);
      }
    } else if (viewMode === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((m, idx) => {
        mockData.labels.push(m);
        const inc = getValue(100, idx) * 10;
        const exp = getValue(200, idx) * 10;
        mockData.income.push(inc);
        mockData.expense.push(exp);
        mockData.savings.push(inc - exp);
      });
    } else if (viewMode === 'year') {
      const fromYear = filters.from_year || 2020;
      const toYear = filters.to_year || 2026;
      let idx = 0;
      for (let yr = fromYear; yr <= toYear; yr++) {
        mockData.labels.push(String(yr));
        const inc = getValue(500, idx) * 100;
        const exp = getValue(600, idx) * 100;
        mockData.income.push(inc);
        mockData.expense.push(exp);
        mockData.savings.push(inc - exp);
        idx++;
      }
    } else if (viewMode === 'custom') {
      const start = filters.start_date ? new Date(filters.start_date) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const end = filters.end_date ? new Date(filters.end_date) : new Date();
      const daysDiff = Math.round((end - start) / (24 * 3600 * 1000));

      if (daysDiff <= 45) {
        // Daily
        const curr = new Date(start);
        let idx = 0;
        while (curr <= end) {
          const lbl = curr.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
          mockData.labels.push(lbl);
          const inc = getValue(30, idx);
          const exp = getValue(80, idx);
          mockData.income.push(inc);
          mockData.expense.push(exp);
          mockData.savings.push(inc - exp);
          curr.setDate(curr.getDate() + 1);
          idx++;
        }
      } else if (daysDiff <= 365) {
        // Monthly
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const curr = new Date(start.getFullYear(), start.getMonth(), 1);
        let idx = 0;
        while (curr <= end) {
          const yrShort = String(curr.getFullYear()).slice(-2);
          const lbl = `${monthNames[curr.getMonth()]} ${yrShort}`;
          mockData.labels.push(lbl);
          const inc = getValue(450, idx) * 10;
          const exp = getValue(550, idx) * 10;
          mockData.income.push(inc);
          mockData.expense.push(exp);
          mockData.savings.push(inc - exp);
          curr.setMonth(curr.getMonth() + 1);
          idx++;
        }
      } else {
        // Yearly
        let idx = 0;
        for (let yr = start.getFullYear(); yr <= end.getFullYear(); yr++) {
          mockData.labels.push(String(yr));
          const inc = getValue(850, idx) * 100;
          const exp = getValue(950, idx) * 100;
          mockData.income.push(inc);
          mockData.expense.push(exp);
          mockData.savings.push(inc - exp);
          idx++;
        }
      }
    }

    // ─── Apply filters to mock data so UI visibly reacts ───────────────────────
    const txnTypeFilter = filters.txn_type;
    const minAmt = filters.min_amount != null ? parseFloat(filters.min_amount) : null;
    const maxAmt = filters.max_amount != null ? parseFloat(filters.max_amount) : null;
    const catFilter = filters.category && filters.category !== 'all' ? filters.category : null;

    mockData.income = mockData.income.map((v, i) => {
      // txn_type: if expense-only → zero out income
      if (txnTypeFilter === 'expense') return 0;
      // category simulation: categories other than Salary/Investment reduce income ~70%
      if (catFilter && !['Salary', 'Investment', 'income'].some(c => catFilter.toLowerCase().includes(c.toLowerCase()))) {
        v = Math.round(v * 0.3);
      }
      // amount range: zero out values outside range
      if (minAmt != null && v < minAmt) return 0;
      if (maxAmt != null && v > maxAmt) return maxAmt;
      return v;
    });

    mockData.expense = mockData.expense.map((v, i) => {
      // txn_type: if income-only → zero out expense
      if (txnTypeFilter === 'income') return 0;
      // category simulation: match category name against expense categories
      if (catFilter) {
        const expCats = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Gadgets', 'expense'];
        const matched = expCats.some(c => c.toLowerCase() === catFilter.toLowerCase());
        if (!matched) v = Math.round(v * 0.25);
      }
      // amount range
      if (minAmt != null && v < minAmt) return 0;
      if (maxAmt != null && v > maxAmt) return maxAmt;
      return v;
    });

    mockData.savings = mockData.income.map((inc, i) => inc - mockData.expense[i]);

    // Compute dynamic summaries
    const totInc = Math.round(mockData.income.reduce((a, b) => a + b, 0));
    const totExp = Math.round(mockData.expense.reduce((a, b) => a + b, 0));
    const totSav = totInc - totExp;
    mockData.summary = {
      total_income: totInc,
      total_expense: totExp,
      total_savings: totSav,
      savings_rate: totInc > 0 ? Math.round((totSav / totInc) * 1000) / 10 : 0.0
    };

    return request(`/analytics/range?${params}`, {}, mockData);
  },

  getCategories: async () => {
    return request('/analytics/categories', {}, null);
  },

  getByCategory: async (scope = 'month') => {
    return request(`/analytics/by-category?scope=${scope}`, {}, null);
  },

  getMonthlyTrend: async () => {
    return request('/analytics/monthly-trend', {}, null);
  },

  getRecentTransactions: async () => {
    return request('/analytics/recent', {}, null);
  },
};

// ─── SAVINGS GOALS SERVICES ──────────────────────────────────────────────────
export const savingsService = {
  getGoals: async () => {
    return request('/savings', {}, null);
  },

  createGoal: async (goalData) => {
    return request('/savings', {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
  },

  addMoney: async (goalId, amount) => {
    return request(`/savings/${goalId}/add-money?amount=${amount}`, {
      method: 'POST'
    });
  },

  withdrawMoney: async (goalId, amount) => {
    return request(`/savings/${goalId}/withdraw?amount=${amount}`, {
      method: 'POST'
    });
  },

  updateGoal: async (goalId, goalData) => {
    return request(`/savings/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(goalData)
    });
  },

  deleteGoal: async (goalId) => {
    return request(`/savings/${goalId}`, {
      method: 'DELETE'
    });
  },

  getContributions: async () => {
    return request('/savings/contributions/all', {}, null);
  }
};

// ─── TRANSACTION SERVICES ────────────────────────────────────────────────────
export const transactionService = {
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/transactions?${params}`, {}, null);
  },

  createTransaction: async (txnData) => {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(txnData)
    });
  },

  updateTransaction: async (txnId, txnData) => {
    return request(`/transactions/${txnId}`, {
      method: 'PUT',
      body: JSON.stringify(txnData)
    });
  },

  deleteTransaction: async (txnId) => {
    return request(`/transactions/${txnId}`, {
      method: 'DELETE'
    });
  }
};

// ─── INVESTMENT SERVICES ─────────────────────────────────────────────────────
export const investmentService = {
  getPortfolio: async () => {
    return request('/investments/portfolio', { timeout: 60000 }, null);
  },

  getSuggestions: async () => {
    return request('/investments/suggestions', { timeout: 50000 }, null);
  },

  create: async (data) => {
    return request('/investments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  redeem: async (id) => {
    return request(`/investments/${id}/redeem`, {
      method: 'POST'
    });
  },

  update: async (id, data) => {
    return request(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Import holdings from a CAS PDF file.
   * @param {File} file - PDF file object
   * @param {string|null} password - PDF password (PAN+DOB format for CAMS)
   * @param {boolean} autoSave - If true, automatically save parsed holdings
   */
  importCAS: async (file, password = null, autoSave = false) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    formData.append('auto_save', String(autoSave));

    const response = await fetch(`${API_BASE_URL}/investments/import-cas`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Do NOT set Content-Type; browser sets it automatically with boundary for multipart
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'CAS import failed' }));
      throw new Error(err.detail || 'CAS import failed');
    }
    return response.json();
  },

  /**
   * Fetch real-time price for a stock/MF/gold asset.
   * @param {string} assetType - "stocks" | "mutual_funds" | "gold"
   * @param {string} assetName - NSE ticker / fund name / any for gold
   * @param {number|null} quantity
   * @param {number|null} buyPrice
   */
  getLivePrice: async (assetType, assetName, quantity = null, buyPrice = null) => {
    const params = new URLSearchParams({ asset_type: assetType, asset_name: assetName });
    if (quantity) params.append('quantity', quantity);
    if (buyPrice) params.append('buy_price', buyPrice);
    return request(`/investments/live-price?${params.toString()}`, {});
  }
};

// ─── AI CHAT SERVICES ────────────────────────────────────────────────────────
export const aiChatService = {
  sendMessage: async (message, activeTab, chatHistory) => {
    return request('/ai/chat', {
      method: 'POST',
      timeout: 60000,
      body: JSON.stringify({
        message,
        active_tab: activeTab,
        chat_history: chatHistory
      })
    }, null);
  }
};
