// Capitallens API Client with Mockup Fallbacks

const API_BASE_URL = 'http://localhost:8000/api/v1';

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

// Generic Fetch Wrapper with Fallback Support
async function request(endpoint, options = {}, mockData = null) {
  // Abort after 20s to prevent hanging indefinitely (live yfinance fetches can take 5-10s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getHeaders(),
        ...options.headers,
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
      const errorText = await response.text();
      throw new Error(errorText || 'API Request Failed');
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
    const tid = setTimeout(() => controller.abort(), 8000);
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

      if (response.status === 401) {
        throw new Error('Invalid credentials');
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Login failed');
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
    const tid = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      clearTimeout(tid);

      if (response.status === 400) {
        const data = await response.json();
        throw new Error(data.detail || 'Email already registered');
      }
      if (!response.ok) {
        throw new Error('Registration failed. Please try again.');
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
    return request('/users/me', {}, {
      id: 1,
      email: 'executive@capitallens.com',
      name: 'Executive User'
    });
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
    return request('/analytics/summary', {}, {
      total_income: 1261042.00,
      total_expense: 12450.00,
      total_savings: 1248592.00,
      savings_rate: 99.0,
      burn_rate: 12450.00,
      runway_months: 99.3,
      savings_rate_trend: 0.0,
      burn_rate_trend: 0.0,
      runway_trend: 0.0
    });
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
    return request('/analytics/categories', {}, {
      categories: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Gadgets']
    });
  },

  getByCategory: async (scope = 'month') => {
    return request(`/analytics/by-category?scope=${scope}`, {}, {
      scope,
      expense_by_category: [
        { category: 'Housing', amount: 4980.00 },
        { category: 'Food', amount: 3112.50 },
        { category: 'Transport', amount: 1245.00 },
        { category: 'Other', amount: 3112.50 }
      ],
      income_by_category: [
        { category: 'Investment', amount: 12000.00 },
        { category: 'Salary', amount: 8000.00 }
      ]
    });
  },

  getMonthlyTrend: async () => {
    return request('/analytics/monthly-trend', {}, {
      monthly_trend: [
        { month: 'MON', income: 600000, expense: 50000 },
        { month: 'TUE', income: 720000, expense: 60000 },
        { month: 'WED', income: 800000, expense: 70000 },
        { month: 'THU', income: 600000, expense: 50000 },
        { month: 'FRI', income: 960000, expense: 90000 },
        { month: 'SAT', income: 1200000, expense: 12450 }
      ]
    });
  },

  getRecentTransactions: async () => {
    return request('/analytics/recent', {}, {
      recent_transactions: [
        {
          id: '#TXN-9082-CS',
          amount: 12450.00,
          type: 'income',
          category: 'Tech Equity Index',
          description: 'Executed trade',
          date: 'Oct 24, 14:02'
        },
        {
          id: '#TXN-8812-CS',
          amount: 1200.00,
          type: 'expense',
          category: 'Digital Collectible A',
          description: 'Pending mint purchase',
          date: 'Oct 24, 11:30'
        },
        {
          id: '#TXN-8745-CS',
          amount: 5000.00,
          type: 'income',
          category: 'Liquid Cash Reserve',
          description: 'Recurring auto transfer',
          date: 'Oct 23, 16:45'
        }
      ]
    });
  }
};

// ─── SAVINGS GOALS SERVICES ──────────────────────────────────────────────────
export const savingsService = {
  getGoals: async () => {
    return request('/savings', {}, [
      {
        id: 1,
        title: "Euro Summer '25",
        target_amount: 10000,
        saved_amount: 7200,
        monthly_contribution: 500,
        deadline: '2025-06-01T00:00:00',
        icon: 'flight_takeoff',
        is_completed: false,
        progress_percentage: 72.0,
        months_remaining: 12
      },
      {
        id: 2,
        title: 'Property Depot',
        target_amount: 100000,
        saved_amount: 45000,
        monthly_contribution: 2500,
        deadline: '2027-01-01T00:00:00',
        icon: 'home',
        is_completed: false,
        progress_percentage: 45.0,
        months_remaining: 18
      },
      {
        id: 3,
        title: 'Retirement Fund',
        target_amount: 500000,
        saved_amount: 455000,
        monthly_contribution: 5000,
        deadline: '2045-12-31T00:00:00',
        icon: 'rocket_launch',
        is_completed: false,
        progress_percentage: 91.0,
        months_remaining: 240
      }
    ]);
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
    return request('/savings/contributions/all', {}, []);
  }
};

// ─── TRANSACTION SERVICES ────────────────────────────────────────────────────
export const transactionService = {
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/transactions?${params}`, {}, []);
  },

  createTransaction: async (txnData) => {
    return request('/transactions', {
      method: 'POST',
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
    return request('/investments/portfolio', {}, {
      total_invested: 0.0,
      current_value: 0.0,
      total_profit_loss: 0.0,
      profit_loss_percentage: 0.0,
      total_monthly_rent: 0.0,
      investments: []
    });
  },

  getSuggestions: async () => {
    return request('/investments/suggestions', {}, {
      available_cash: 0.0,
      savings_rate: 0.0,
      suggestions: []
    });
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
      body: JSON.stringify({
        message,
        active_tab: activeTab,
        chat_history: chatHistory
      })
    }, {
      response: "Aapka system offline hai, par main aapko bata sakta hoon ki aapki financial command configuration bilkul active hai! Please backend connect karein full advice ke liye."
    });
  }
};
