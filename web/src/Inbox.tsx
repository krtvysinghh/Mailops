import React, { useEffect, useState } from 'react';

interface Email {
  id: string;
  fromAddr: string;
  toAddr: string;
  subject: string;
  textBody: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8787/api/inbox')
      .then(res => res.json())
      .then(data => {
        setEmails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inbox</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700">
          Compose
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Your inbox is empty.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {emails.map(email => (
              <li key={email.id} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {email.direction === 'inbound' ? email.fromAddr : `To: ${email.toAddr}`}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{email.subject || '(No Subject)'}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(email.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
