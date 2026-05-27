import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Percent,
  List,
} from 'lucide-react';
import {
  fetchTransactions,
  fetchTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../api/transactions';

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
];

const EMPTY_FORM = {
  amount: '',
  type: 'expense',
  category: 'Food',
  description: '',
  date: '',
};

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function SummaryCard({ label, value, sub, variant }) {
  return (
    <div className={`txn-summary-card txn-summary-card--${variant}`}>
      <p className="txn-summary-card__label">{label}</p>
      <p className="txn-summary-card__value">{value}</p>
      {sub && <p className="txn-summary-card__sub">{sub}</p>}
    </div>
  );
}

function TransactionForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    date: initial?.date ? toDatetimeLocal(initial.date) : toDatetimeLocal(new Date().toISOString()),
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    onSubmit({
      amount,
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim() || null,
      date: fromDatetimeLocal(form.date),
    });
  };

  return (
    <form className="txn-form glass-card" onSubmit={handleSubmit}>
      <div className="txn-form__header">
        <h3>{initial?.id ? 'Edit transaction' : 'Add transaction'}</h3>
        <button type="button" className="txn-icon-btn" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="txn-form__grid">
        <div>
          <label className="dash-label" htmlFor="txn-amount">
            Amount
          </label>
          <input
            id="txn-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            className="dash-input txn-input"
            value={form.amount}
            onChange={handleChange}
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="dash-label" htmlFor="txn-type">
            Type
          </label>
          <select
            id="txn-type"
            name="type"
            className="dash-input txn-input"
            value={form.type}
            onChange={handleChange}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="dash-label" htmlFor="txn-category">
            Category
          </label>
          <input
            id="txn-category"
            name="category"
            list="txn-categories"
            className="dash-input txn-input"
            value={form.category}
            onChange={handleChange}
            required
          />
          <datalist id="txn-categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="dash-label" htmlFor="txn-date">
            Date
          </label>
          <input
            id="txn-date"
            name="date"
            type="datetime-local"
            className="dash-input txn-input"
            value={form.date}
            onChange={handleChange}
          />
        </div>
        <div className="txn-form__full">
          <label className="dash-label" htmlFor="txn-desc">
            Description
          </label>
          <input
            id="txn-desc"
            name="description"
            type="text"
            className="dash-input txn-input"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional note"
          />
        </div>
      </div>

      <div className="txn-form__actions">
        <button type="button" className="txn-btn txn-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="txn-btn txn-btn--primary" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="txn-spin" /> : null}
          {initial?.id ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterCategory.trim()) params.category = filterCategory.trim();

      const [txns, sum] = await Promise.all([
        fetchTransactions(params),
        fetchTransactionSummary(),
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await createTransaction(payload);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await updateTransaction(editing.id, payload);
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (txn) => {
    setShowForm(false);
    setEditing({
      id: txn.id,
      amount: String(txn.amount),
      type: txn.type,
      category: txn.category,
      description: txn.description || '',
      date: txn.date,
    });
  };

  if (loading && !transactions.length) {
    return (
      <div className="txn-loading">
        <Loader2 size={28} className="txn-spin" />
        <p>Loading transactions…</p>
      </div>
    );
  }

  return (
    <div className="txn-page animate-in">
      {error && (
        <div className="txn-alert" role="alert">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {summary && (
        <div className="txn-summary stagger">
          <SummaryCard
            label="Total income"
            value={formatCurrency(summary.total_income)}
            sub="All time"
            variant="income"
          />
          <SummaryCard
            label="Total expenses"
            value={formatCurrency(summary.total_expense)}
            sub="All time"
            variant="expense"
          />
          <SummaryCard
            label="Net savings"
            value={formatCurrency(summary.total_savings)}
            sub={`${summary.savings_rate}% savings rate`}
            variant="savings"
          />
          <SummaryCard
            label="Transactions"
            value={summary.transaction_count}
            sub="Recorded entries"
            variant="count"
          />
        </div>
      )}

      <div className="txn-toolbar glass-card">
        <div className="txn-filters">
          <Filter size={16} className="txn-filters__icon" />
          <select
            className="dash-input txn-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="text"
            className="dash-input txn-filter-input"
            placeholder="Filter by category…"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="txn-btn txn-btn--primary"
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
        >
          <Plus size={16} />
          Add transaction
        </button>
      </div>

      {showForm && (
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {editing && (
        <TransactionForm
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
          submitting={submitting}
        />
      )}

      <div className="txn-table-wrap glass-card">
        <div className="txn-table-header">
          <h3>
            <List size={18} /> All transactions
          </h3>
          <span className="dash-badge">{transactions.length} shown</span>
        </div>

        {transactions.length === 0 ? (
          <div className="txn-empty">
            <Wallet size={32} />
            <p>No transactions yet</p>
            <span>Add your first income or expense to get started.</span>
          </div>
        ) : (
          <div className="txn-table-scroll">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="txn-table__amount">Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td data-label="Date">{formatDate(txn.date)}</td>
                    <td data-label="Description">
                      <span className="txn-desc">{txn.description || '—'}</span>
                    </td>
                    <td data-label="Category">
                      <span className="txn-category-pill">{txn.category}</span>
                    </td>
                    <td data-label="Type">
                      <span className={`txn-type-badge txn-type-badge--${txn.type}`}>
                        {txn.type === 'income' ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {txn.type}
                      </span>
                    </td>
                    <td data-label="Amount" className={`txn-amount txn-amount--${txn.type}`}>
                      {txn.type === 'income' ? '+' : '−'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td data-label="Actions">
                      <div className="txn-row-actions">
                        <button
                          type="button"
                          className="txn-icon-btn"
                          onClick={() => openEdit(txn)}
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="txn-icon-btn txn-icon-btn--danger"
                          onClick={() => handleDelete(txn.id)}
                          disabled={deletingId === txn.id}
                          aria-label="Delete"
                        >
                          {deletingId === txn.id ? (
                            <Loader2 size={15} className="txn-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {summary && summary.total_income > 0 && (
        <p className="txn-footer-note">
          <Percent size={12} /> Savings rate: {summary.savings_rate}% of total income
        </p>
      )}
    </div>
  );
}
