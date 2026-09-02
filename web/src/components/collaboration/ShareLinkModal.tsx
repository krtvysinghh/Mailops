import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';

interface ShareLinkModalProps {
  threadId: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ threadId }) => {
  const { createShareLink } = useCollaboration();
  const [isOpen, setIsOpen] = useState(false);
  const [expiration, setExpiration] = useState<'1d' | '7d' | 'never'>('7d');
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    let expiresInMs: number | undefined;
    if (expiration === '1d') expiresInMs = 24 * 60 * 60 * 1000;
    if (expiration === '7d') expiresInMs = 7 * 24 * 60 * 60 * 1000;

    const url = await createShareLink(threadId, {
      expiresInMs,
      password: password.trim() || undefined,
      maxViews: typeof maxViews === 'number' ? maxViews : undefined,
    });
    setGeneratedUrl(url);
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors"
      >
        <span>🔗</span>
        <span>Share Thread Snapshot</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔗</span>
                <h4 className="text-base font-bold text-gray-900">Create Shareable Thread Link</h4>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setGeneratedUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Generate a secure, tokenized public snapshot. Internal notes, comments, and BCC headers are automatically stripped.
            </p>

            {!generatedUrl ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Link Expiration</label>
                  <select
                    value={expiration}
                    onChange={e => setExpiration(e.target.value as any)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="1d">Expires in 24 Hours</option>
                    <option value="7d">Expires in 7 Days</option>
                    <option value="never">Never Expire (Permanent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Require password to view..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max View Count Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 5 views (burn-after-reading)"
                    value={maxViews}
                    onChange={e => setMaxViews(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs"
                  >
                    Generate Secure Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 text-xs">
                  ✓ Public snapshot link generated with SHA-256 token!
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Shareable URL</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedUrl}
                      className="w-full text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-xs"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
