import React, { useState } from 'react';
import DomainSetup from './DomainSetup';
import Inbox from './Inbox';

function App() {
  const [tab, setTab] = useState<'inbox' | 'setup'>('inbox');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📬</span>
            <h1 className="text-xl font-bold text-gray-900">Mailops</h1>
          </div>
          <nav className="flex space-x-4">
            <button 
              onClick={() => setTab('inbox')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${tab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Inbox
            </button>
            <button 
              onClick={() => setTab('setup')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${tab === 'setup' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Domain Setup
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {tab === 'inbox' ? <Inbox /> : <DomainSetup />}
      </main>
    </div>
  );
}

export default App;
