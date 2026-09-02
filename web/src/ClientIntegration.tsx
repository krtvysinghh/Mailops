import React from 'react';

export default function ClientIntegration() {
  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Integrate with Gmail, Outlook, or Apple Mail</h2>
        <p className="text-gray-600">
          You don't have to use this web dashboard! You can connect your custom domain email directly to your favorite mail client for a seamless experience.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">1. Receiving Emails (Forwarding)</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            To receive emails in your personal Gmail or Outlook inbox, go to your <b>Cloudflare Dashboard &gt; Email &gt; Email Routing</b> and create a custom address:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li><b>Custom address:</b> <code>hello@yourdomain.com</code></li>
            <li><b>Action:</b> Send to <code>your.personal.email@gmail.com</code></li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            * Note: You can add multiple actions! You can forward to your Gmail AND send to the Mailops Worker to keep a backup in this dashboard.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">2. Sending Emails (SMTP Setup)</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            To reply to emails from your custom domain inside Gmail (using "Send mail as") or Outlook, use the free Resend SMTP server.
          </p>
          
          <div className="bg-gray-900 rounded-md p-4 mt-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-gray-400">SMTP Server</div>
              <div className="col-span-2 text-green-400 font-mono">smtp.resend.com</div>
              
              <div className="text-gray-400">Port</div>
              <div className="col-span-2 text-green-400 font-mono">465 (SSL) or 587 (TLS)</div>
              
              <div className="text-gray-400">Username</div>
              <div className="col-span-2 text-green-400 font-mono">resend</div>
              
              <div className="text-gray-400">Password</div>
              <div className="col-span-2 text-green-400 font-mono">Your Resend API Key (re_...)</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Gmail Setup Instructions:</h4>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2">
              <li>Open Gmail Settings (Gear icon) &gt; See all settings &gt; <b>Accounts and Import</b>.</li>
              <li>Under "Send mail as", click <b>Add another email address</b>.</li>
              <li>Enter your name and your custom domain email (e.g., <code>hello@yourdomain.com</code>). Uncheck "Treat as an alias".</li>
              <li>Enter the SMTP details from above using your Resend API key as the password.</li>
              <li>Verify the code sent to your email (which will forward to your Gmail inbox!).</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
