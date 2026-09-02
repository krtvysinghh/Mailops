import React, { useState } from 'react';
import { useCollaboration, type CRMStage } from '../../context/CollaborationContext';

interface CRMSidebarProps {
  senderEmail?: string;
}

export const CRMSidebar: React.FC<CRMSidebarProps> = ({ senderEmail }) => {
  const { crmProfile, updateCRMContact, addCRMDeal } = useCollaboration();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(crmProfile?.notes || '');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number | ''>('');
  const [dealStage, setDealStage] = useState('discovery');

  const targetEmail = senderEmail || crmProfile?.email || 'customer@enterprise.com';

  if (!crmProfile) return null;

  const handleSaveNotes = async () => {
    await updateCRMContact(targetEmail, { notes: noteText });
    setIsEditingNotes(false);
  };

  const handleStageChange = async (newStage: CRMStage) => {
    await updateCRMContact(targetEmail, { stage: newStage });
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim() || dealValue === '') return;
    await addCRMDeal(targetEmail, {
      title: dealTitle.trim(),
      value: Number(dealValue),
      currency: 'USD',
      stage: dealStage,
    });
    setDealTitle('');
    setDealValue('');
    setShowAddDeal(false);
  };

  const getStageBadge = (st: CRMStage) => {
    switch (st) {
      case 'vip':
        return <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-full font-bold">⭐ VIP</span>;
      case 'active_customer':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold">Active Customer</span>;
      case 'opportunity':
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold">Opportunity</span>;
      case 'lead':
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">Lead</span>;
      case 'churned':
        return <span className="bg-red-100 text-red-800 text-[11px] px-2 py-0.5 rounded-full font-bold">Churned</span>;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Header Profile */}
      <div className="flex items-start justify-between pb-3 border-b border-gray-100">
        <div>
          <h4 className="text-base font-bold text-gray-900">{crmProfile.name || 'Contact Profile'}</h4>
          <p className="text-xs text-gray-500 font-mono">{targetEmail}</p>
          <p className="text-xs text-blue-600 font-medium mt-0.5">{crmProfile.company}</p>
        </div>
        <div>{getStageBadge(crmProfile.stage)}</div>
      </div>

      {/* Relationship Health Meter */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-700">Relationship Health</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getHealthColor(crmProfile.healthScore)}`}>
            {crmProfile.healthScore} / 100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              crmProfile.healthScore >= 80
                ? 'bg-emerald-500'
                : crmProfile.healthScore >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${crmProfile.healthScore}%` }}
          />
        </div>
      </div>

      {/* Interaction Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <div className="text-base font-bold text-gray-900">{crmProfile.interactionCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-medium">Total Emails</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <div className="text-base font-bold text-emerald-600">{crmProfile.inboundCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-medium">Inbound</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
          <div className="text-base font-bold text-blue-600">{crmProfile.outboundCount}</div>
          <div className="text-[10px] text-gray-500 uppercase font-medium">Outbound</div>
        </div>
      </div>

      {/* Stage Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Stage</label>
        <select
          value={crmProfile.stage}
          onChange={e => handleStageChange(e.target.value as CRMStage)}
          className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
        >
          {(['lead', 'opportunity', 'active_customer', 'vip', 'churned'] as CRMStage[]).map(st => (
            <option key={st} value={st}>
              {st.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* CRM Notes */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700">Account Notes</span>
          <button
            onClick={() => {
              if (isEditingNotes) handleSaveNotes();
              else setIsEditingNotes(true);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {isEditingNotes ? 'Save' : 'Edit'}
          </button>
        </div>
        {isEditingNotes ? (
          <textarea
            rows={3}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        ) : (
          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 whitespace-pre-wrap">
            {crmProfile.notes || 'No notes added yet.'}
          </p>
        )}
      </div>

      {/* Deal Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-700">Deals & Opportunities</span>
          <button
            onClick={() => setShowAddDeal(!showAddDeal)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAddDeal ? 'Cancel' : '+ Add Deal'}
          </button>
        </div>

        {showAddDeal && (
          <form onSubmit={handleAddDeal} className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5 mb-2 space-y-2">
            <input
              type="text"
              required
              placeholder="Deal Title (e.g. Enterprise License)"
              value={dealTitle}
              onChange={e => setDealTitle(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                placeholder="Value ($)"
                value={dealValue}
                onChange={e => setDealValue(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={dealStage}
                onChange={e => setDealStage(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
              >
                <option value="discovery">Discovery</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won 🎉</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
              >
                Add Deal
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5">
          {crmProfile.deals.map(deal => (
            <div
              key={deal.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
            >
              <div>
                <div className="font-semibold text-gray-900">{deal.title}</div>
                <div className="text-[10px] text-gray-500 capitalize">{deal.stage}</div>
              </div>
              <div className="font-bold text-emerald-600">
                ${deal.value.toLocaleString()} {deal.currency}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
