import React, { useState } from 'react';
import { transactionService } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import AddTransactionModal from './AddTransactionModal';

export default function RecentCommandLogs({ transactions, onRefresh }) {
  const { formatCurrency } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="midnight-glass rounded-xl overflow-hidden cursor-default">
      <div className="p-6 md:p-card-padding border-b border-glass-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-headline-md text-lg md:text-[18px] text-text-primary">Recent Command Logs</h3>
        
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-primary text-sm font-semibold hover:text-emerald-glow transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Log
          </button>
          
          <button className="flex items-center gap-1 text-on-surface-variant text-sm md:text-body-base cursor-pointer hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          
          <button className="flex items-center gap-1 text-on-surface-variant text-sm md:text-body-base cursor-pointer hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-glass-border">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-surface-variant/10 text-label-caps text-on-surface-variant border-b border-glass-border text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">TRANSACTION ID</th>
              <th className="px-6 py-4 font-bold">ASSET CLASS</th>
              <th className="px-6 py-4 font-bold">STATUS</th>
              <th className="px-6 py-4 font-bold">TIMESTAMP</th>
              <th className="px-6 py-4 font-bold text-right">QUANTITY</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-glass-border">
            {transactions.map((txn, index) => {
              const isIncome = txn.type === 'income';
              const isPending = txn.id.toString().includes('8812') || index === 1;

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
                  
                  <td className="px-6 py-4 text-on-surface-variant text-sm">
                    {txn.date}
                  </td>
                  
                  <td className={`px-6 py-4 text-right font-bold text-sm ${isIncome ? 'text-emerald-glow' : 'text-rose-expense'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(txn.amount)))}
                  </td>
                </tr>
              );
            })}

            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-on-surface-variant opacity-60 text-sm">
                  No logs available. Use 'Add Log' to seed items!
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
