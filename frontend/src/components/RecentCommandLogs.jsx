import React, { useState } from 'react';
import { transactionService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import AddTransactionModal from './AddTransactionModal';

export default function RecentCommandLogs({ transactions, onRefresh }) {
  const { formatCurrency } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const handleCreateTransaction = async (txnData) => {
    await transactionService.createTransaction(txnData);
    if (onRefresh) onRefresh();
  };

  // Helper HSL bullets for asset classes
  const getAssetBullet = (category) => {
    const name = category.toLowerCase();
    if (name.includes('tech') || name.includes('equity') || name.includes('income')) {
      return 'bg-primary';
    } else if (name.includes('collectible') || name.includes('digital') || name.includes('art') || name.includes('violet')) {
      return 'bg-violet-accent';
    } else {
      return 'bg-secondary';
    }
  };

  // Implement Live CSV Exporter
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;

    let csvContent = "Transaction ID,Asset Class,Status,Timestamp,Type,Amount\r\n";
    transactions.forEach((txn) => {
      const isIncome = txn.type === 'income';
      const isPending = false;
      const status = "EXECUTED";
      const cleanAmount = isIncome ? `+${txn.amount}` : `-${txn.amount}`;
      csvContent += `"${txn.id}","${txn.category}","${status}","${txn.date}","${txn.type}","${cleanAmount}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `capitallens_ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Filtering Logic
  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'INCOME') return txn.type === 'income';
    if (filterType === 'EXPENSE') return txn.type === 'expense';
    const isPending = false;
    if (filterType === 'PENDING') return isPending;
    if (filterType === 'EXECUTED') return !isPending;
    return true;
  });

  return (
    <div className="midnight-glass rounded-xl overflow-hidden cursor-default border border-glass-border/30">
      <div className="p-6 md:p-card-padding border-b border-glass-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-headline-md text-lg md:text-[18px] text-text-primary">Recent Transactions Ledger</h3>
        
        <div className="flex gap-4">
          {/* Add Log button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-primary text-sm font-semibold hover:text-emerald-glow transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Log
          </button>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1 text-sm md:text-body-base cursor-pointer hover:text-primary transition-colors ${
              showFilterBar ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          
          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-on-surface-variant text-sm md:text-body-base cursor-pointer hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Filter panel drawer */}
      {showFilterBar && (
        <div className="px-6 py-3 bg-[#0a0f1d]/40 border-b border-glass-border/30 flex gap-2 flex-wrap items-center animate-fade-in">
          <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-wider mr-2">Filter Ledger:</span>
          {['ALL', 'INCOME', 'EXPENSE', 'EXECUTED', 'PENDING'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-primary/15 border border-primary/30 text-primary'
                  : 'bg-[#182235]/40 border border-glass-border/20 text-on-surface-variant hover:text-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-glass-border">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-surface-variant/10 text-label-caps text-on-surface-variant border-b border-glass-border text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">TRANSACTION ID</th>
              <th className="px-6 py-4 font-bold">ASSET CLASS</th>
              <th className="px-6 py-4 font-bold">STATUS</th>
              <th className="px-6 py-4 font-bold">TIMESTAMP</th>
              <th className="px-6 py-4 font-bold text-right">AMOUNT</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-glass-border">
            {filteredTransactions.map((txn, index) => {
              const isIncome = txn.type === 'income';
              const isPending = false;

              return (
                <tr key={txn.id || index} className="hover:bg-slate-surface/50 transition-colors group">
                  <td className="px-6 py-4 font-body-bold text-primary text-sm font-bold">
                    {txn.id.toString().startsWith('#') ? txn.id : `#TXN-${txn.id}-CS`}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <div className={`w-2 h-2 rounded-full ${getAssetBullet(txn.category)}`}></div>
                      {txn.category}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 shadow-[0_0_8px_rgba(0,203,230,0.1)]">
                        PENDING
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(90,240,179,0.1)]">
                        EXECUTED
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-on-surface-variant text-sm font-medium">
                    {txn.date}
                  </td>
                  
                  <td className={`px-6 py-4 text-right font-bold text-sm ${isIncome ? 'text-emerald-glow' : 'text-rose-expense'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
                  </td>
                </tr>
              );
            })}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-on-surface-variant opacity-60 text-sm">
                  No matching logs found in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD LOG MODAL (shared AddTransactionModal) --- */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateTransaction}
      />
    </div>
  );
}
