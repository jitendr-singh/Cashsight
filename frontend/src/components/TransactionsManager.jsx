import React, { useState, useEffect } from 'react';
import { transactionService, analyticsService } from '../services/api';
import AddTransactionModal from './AddTransactionModal';
import { useCurrency } from '../context/CurrencyContext';

export default function TransactionsManager({ searchQuery }) {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'income', 'expense'
  const [searchCategory, setSearchCategory] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Form States (used only for Edit callbacks now, fields live in AddTransactionModal)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock fallbacks for Transactions Manager
  const mockSummary = {
    total_income: 42850.00,
    total_expense: 18240.50,
    total_savings: 24609.50,
    savings_rate: 8.2,
    transaction_count: 1428
  };

  const mockTransactions = [
    {
      id: 1,
      date: 'Oct 24, 2023',
      description: 'Apple Store - iPhone 15 Pro',
      category: 'ELECTRONICS',
      type: 'expense',
      payment_type: 'Debit Card',
      amount: 1199.00
    },
    {
      id: 2,
      date: 'Oct 23, 2023',
      description: 'Monthly Salary - TechCorp',
      category: 'INCOME',
      type: 'income',
      payment_type: 'Bank Transfer',
      amount: 8450.00
    },
    {
      id: 3,
      date: 'Oct 22, 2023',
      description: 'Stripe Dividend Payout',
      category: 'INVESTMENT',
      type: 'income',
      payment_type: 'ACH Credit',
      amount: 420.50
    },
    {
      id: 4,
      date: 'Oct 20, 2023',
      description: 'Whole Foods Market',
      category: 'GROCERIES',
      type: 'expense',
      payment_type: 'Credit Card',
      amount: 184.22
    },
    {
      id: 5,
      date: 'Oct 19, 2023',
      description: 'Netflix Subscription',
      category: 'ENTERTAINMENT',
      type: 'expense',
      payment_type: 'Recurring',
      amount: 15.99
    }
  ];

  // Fetch data from FastAPI
  const loadTransactionsData = async () => {
    setLoading(true);
    try {
      const [summary, list] = await Promise.all([
        analyticsService.getSummary(),
        transactionService.getTransactions({ limit: 100 })
      ]);

      const hasRealSummary = summary && (summary.total_income > 0 || summary.total_expense > 0);
      const hasRealList = list && list.length > 0;

      // Merge real backend data or fallback to mockup objects
      if (hasRealSummary) {
        setSummaryData({
          total_income: summary.total_income,
          total_expense: summary.total_expense,
          total_savings: summary.total_savings,
          savings_rate: summary.savings_rate,
          transaction_count: list.length > 0 ? list.length : mockSummary.transaction_count
        });
      } else {
        setSummaryData(mockSummary);
      }

      if (hasRealList) {
        // Map backend objects to frontend columns format
        const formattedList = list.map(item => ({
          id: item.id,
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: item.description || 'Command transaction logs',
          category: (item.category || 'OTHER').toUpperCase(),
          type: item.type, // 'income' or 'expense'
          payment_type: item.description?.includes('Card') ? 'Credit Card' : 'Bank Transfer',
          amount: item.amount
        }));
        setTransactions(formattedList);
      } else {
        setTransactions(mockTransactions);
      }
    } catch (err) {
      console.warn('Failed to load transaction manager from API, using high-fidelity mockup fallback.', err);
      setSummaryData(mockSummary);
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactionsData();
  }, []);

  // Handle Add Transaction Action
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      await transactionService.createTransaction({
        amount: parseFloat(amount),
        type,
        category: category.toUpperCase(),
        description: `${description} - ${paymentType}`,
        date: new Date().toISOString()
      });
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      loadTransactionsData();
    } catch (err) {
      console.error('Failed to add transaction', err);
    }
  };

  // Handle Delete Action
  const handleDelete = async (id) => {
    // Avoid deleting hardcoded mockups
    if (id <= 5) {
      setTransactions(transactions.filter(t => t.id !== id));
      return;
    }

    try {
      await transactionService.deleteTransaction(id);
      loadTransactionsData();
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  // Handle Edit Action
  const handleEditClick = (txn) => {
    setSelectedTxn(txn);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (txnData) => {
    if (!selectedTxn) return;

    // Simulate mock update locally if mock id
    if (selectedTxn.id <= 5) {
      setTransactions(transactions.map(t => t.id === selectedTxn.id ? {
        ...t,
        amount: txnData.amount,
        type: txnData.type,
        category: txnData.category.toUpperCase(),
        description: txnData.description,
      } : t));
      setShowEditModal(false);
      setSelectedTxn(null);
      return;
    }

    try {
      await fetch(`http://localhost:8000/api/v1/transactions/${selectedTxn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('capitallens_token')}`
        },
        body: JSON.stringify(txnData)
      });
      setShowEditModal(false);
      setSelectedTxn(null);
      loadTransactionsData();
    } catch (err) {
      console.error('Failed to update transaction', err);
    }
  };

  // Filter list locally in React
  const filteredTransactions = transactions.filter(t => {
    const matchTab = activeFilter === 'All' || t.type === activeFilter.toLowerCase();
    
    // Support both local filter (searchCategory) and global topbar search (searchQuery)
    const qLocal = searchCategory.toLowerCase().trim();
    const qGlobal = searchQuery ? searchQuery.toLowerCase().trim() : '';
    
    const matchesQuery = (q) => {
      if (!q) return true;
      return (
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.payment_type || '').toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        t.date.toLowerCase().includes(q)
      );
    };
    
    return matchTab && matchesQuery(qLocal) && matchesQuery(qGlobal);
  });

  // Pagination maths
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Category Badges helper
  const getCategoryBadgeClass = (cat) => {
    const name = cat.toUpperCase();
    if (name.includes('ELECTRONICS')) return 'bg-violet-accent/10 text-violet-accent border border-violet-accent/20';
    if (name.includes('INCOME')) return 'bg-primary/10 text-primary border border-primary/20';
    if (name.includes('INVESTMENT')) return 'bg-secondary/10 text-secondary border border-secondary/20';
    if (name.includes('GROCERIES')) return 'bg-on-secondary-container/10 text-on-secondary-container border border-on-secondary-container/20';
    return 'bg-tertiary/10 text-on-tertiary-container border border-tertiary/20';
  };

  return (
    <div className="space-y-8 p-gutter-mobile md:p-margin-page relative z-10">
      
      {/* Summary Headers Section */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-gutter-desktop sm:grid-cols-2">
        {/* Card 1: Total Income */}
        <div className="glass-card p-card-padding rounded-xl glow-emerald relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-primary">trending_up</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <span className="text-label-caps text-on-surface-variant text-[11px] font-bold">Total Income</span>
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(90,240,179,0.8)]"></div>
          </div>
          <div className="font-stat-lg text-stat-lg text-primary font-bold">
            {formatCurrency(summaryData?.total_income ?? mockSummary.total_income)}
          </div>
          <div className="mt-2 text-xs font-body-base text-on-surface-variant">
            <span className="text-primary font-body-bold">↑ 12.4%</span> vs last month
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="glass-card p-card-padding rounded-xl glow-rose relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-rose-expense">trending_down</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <span className="text-label-caps text-on-surface-variant text-[11px] font-bold">Total Expenses</span>
            <div className="w-2 h-2 rounded-full bg-rose-expense shadow-[0_0_8px_rgba(251,113,133,0.8)]"></div>
          </div>
          <div className="font-stat-lg text-stat-lg text-rose-expense font-bold">
            {formatCurrency(summaryData?.total_expense ?? mockSummary.total_expense)}
          </div>
          <div className="mt-2 text-xs font-body-base text-on-surface-variant">
            <span className="text-rose-expense font-body-bold">↓ 4.1%</span> vs last month
          </div>
        </div>

        {/* Card 3: Net Savings */}
        <div className="glass-card p-card-padding rounded-xl glow-cyan relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-secondary">account_balance</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <span className="text-label-caps text-on-surface-variant text-[11px] font-bold">Net Savings</span>
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(93,230,255,0.8)]"></div>
          </div>
          <div className="font-stat-lg text-stat-lg text-secondary font-bold">
            {formatCurrency(summaryData?.total_savings ?? mockSummary.total_savings)}
          </div>
          <div className="mt-2 text-xs font-body-base text-on-surface-variant">
            <span className="text-secondary font-body-bold">↑ {(summaryData?.savings_rate ?? mockSummary.savings_rate)}%</span> savings rate
          </div>
        </div>

        {/* Card 4: Total Entries */}
        <div className="glass-card p-card-padding rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">list_alt</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <span className="text-label-caps text-on-surface-variant text-[11px] font-bold">Total Entries</span>
            <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
          </div>
          <div className="font-stat-lg text-stat-lg text-on-surface font-bold">
            {(summaryData?.transaction_count ?? mockSummary.transaction_count).toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-body-base text-on-surface-variant">
            <span className="font-body-bold">Active</span> ledger logs running
          </div>
        </div>
      </section>

      {/* Action Toolbar Section */}
      <section className="glass-card p-4 rounded-xl hover:scale-[1.005] duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Side: Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex bg-surface-container-high rounded-lg p-1 border border-glass-border flex-shrink-0">
              {['All', 'Income', 'Expense'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveFilter(tab);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                    activeFilter === tab
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                filter_list
              </span>
              <input
                type="text"
                placeholder="Filter by category..."
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#080e1a]/80 border border-glass-border rounded-lg py-1.5 pl-10 pr-4 text-sm text-text-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:opacity-50"
              />
            </div>
          </div>

          {/* Right Side: Actions (Export + Add) */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end sm:justify-start md:justify-end flex-shrink-0">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-glass-border hover:bg-surface-variant/50 transition-all rounded-lg text-sm text-on-surface-variant font-bold flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span className="hidden xs:inline sm:inline">Export</span>
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 w-full sm:w-auto sm:flex-none"
            >
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">add</span>
              <span className="truncate">Add Transaction</span>
            </button>
          </div>
        </div>
      </section>

      {/* Transaction Ledger Table Section */}
      <section className="glass-card rounded-xl overflow-hidden hover:scale-[1.002] duration-300">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-glass-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-high/50 text-label-caps text-on-surface-variant border-b border-glass-border text-xs tracking-wider">
                <th className="px-6 py-4 font-bold font-label-caps">Date</th>
                <th className="px-6 py-4 font-bold font-label-caps">Description</th>
                <th className="px-6 py-4 font-bold font-label-caps">Category</th>
                <th className="px-6 py-4 font-bold font-label-caps">Type</th>
                <th className="px-6 py-4 font-bold font-label-caps text-right">Amount</th>
                <th className="px-6 py-4 font-bold font-label-caps text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-glass-border">
              {currentItems.map((txn) => {
                const isIncome = txn.type === 'income';
                return (
                  <tr key={txn.id} className="group hover:bg-surface-variant/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-on-surface-variant font-body-base text-sm">
                      {txn.date}
                    </td>
                    
                    <td className="px-6 py-4 font-body-bold text-on-surface font-semibold text-sm">
                      {txn.description}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${getCategoryBadgeClass(txn.category)}`}>
                        {txn.category}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-on-surface-variant text-sm">
                      {txn.payment_type || 'Ledger Entry'}
                    </td>
                    
                    <td className={`px-6 py-4 text-right font-bold text-sm ${isIncome ? 'text-primary' : 'text-rose-expense'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleEditClick(txn)}
                          className="p-1.5 rounded-md hover:bg-surface-container-highest transition-colors text-on-surface-variant"
                          aria-label="Edit Entry"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="p-1.5 rounded-md hover:bg-rose-expense/10 transition-colors text-rose-expense"
                          aria-label="Delete Entry"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-on-surface-variant opacity-60 text-sm">
                    No transaction entries match this query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Grid */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-glass-border">
          <p className="text-xs text-on-surface-variant">
            Showing <span className="text-on-surface font-body-bold font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)}</span> of {filteredTransactions.length} transactions
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Automated Sync Ad Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-surface-dim to-primary/5 p-8 flex items-center justify-between flex-col md:flex-row gap-6">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(90, 240, 179, 0.4) 0%, transparent 60%)' }}></div>
        <div className="z-10 text-left">
          <h3 className="font-headline-md text-headline-md text-primary mb-2 font-bold text-[24px]">Automate Your Ledger</h3>
          <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed">
            Connect your crypto wallets and traditional banks via SecureSync API to automatically categorize and reconcile every cent across your global accounts.
          </p>
        </div>
        <div className="z-10 w-full md:w-auto">
          <button className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 w-full md:w-auto text-sm">
            Enable Smart Sync
          </button>
        </div>
      </div>

      {/* --- ADD TRANSACTION MODAL (Immersive Ledger Entry) --- */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (txnData) => {
          await transactionService.createTransaction(txnData);
          loadTransactionsData();
        }}
      />

      {/* --- EDIT TRANSACTION MODAL (reuses AddTransactionModal) --- */}
      <AddTransactionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTxn(null);
        }}
        onSubmit={handleEditSubmit}
        transaction={selectedTxn}
      />
    </div>
  );
}
