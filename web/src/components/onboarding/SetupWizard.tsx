import React, { useState } from 'react';

type Step = 'Welcome' | 'AddDomain' | 'VerifyDNS' | 'ConfigureForwarding' | 'Done';

const STEPS: Step[] = ['Welcome', 'AddDomain', 'VerifyDNS', 'ConfigureForwarding', 'Done'];

export const SetupWizard: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [domain, setDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const validateDomain = () => {
    if (!domain) {
      setDomainError('Domain is required');
      return false;
    }
    // simple domain regex
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!regex.test(domain)) {
      setDomainError('Please enter a valid domain (e.g. example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const handleDomainSubmit = () => {
    if (validateDomain()) {
      nextStep();
    }
  };

  const verifyDNS = () => {
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      setDnsVerified(true);
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
        
        <div style={styles.content}>
          {currentStep === 'Welcome' && (
            <div style={styles.stepContent}>
              <h2 style={styles.title}>Welcome to Mailops 🚀</h2>
              <p style={styles.text}>
                Let's get your custom email set up in just a few minutes. 
                You'll need a domain name that you own and access to its DNS settings.
              </p>
              <button style={styles.primaryButton} onClick={nextStep}>Let's Go</button>
            </div>
          )}

          {currentStep === 'AddDomain' && (
            <div style={styles.stepContent}>
              <h2 style={styles.title}>Add Your Domain</h2>
              <p style={styles.text}>What domain would you like to use for your email?</p>
              <div style={styles.inputGroup}>
                <input 
                  type="text" 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)} 
                  placeholder="example.com"
                  style={styles.input}
                />
                {domainError && <span style={styles.errorText}>{domainError}</span>}
              </div>
              <div style={styles.buttonGroup}>
                <button style={styles.secondaryButton} onClick={prevStep}>Back</button>
                <button style={styles.primaryButton} onClick={handleDomainSubmit}>Next</button>
              </div>
            </div>
          )}

          {currentStep === 'VerifyDNS' && (
            <div style={styles.stepContent}>
              <h2 style={styles.title}>Verify DNS Records</h2>
              <p style={styles.text}>
                Add the following TXT record to your DNS provider to verify you own <strong>{domain}</strong>.
              </p>
              <div style={styles.codeBlock}>
                Type: TXT<br/>
                Name: @<br/>
                Value: mailops-verify=a8b9c0d1e2f3
              </div>
              
              <div style={styles.buttonGroup}>
                <button style={styles.secondaryButton} onClick={prevStep}>Back</button>
                {dnsVerified ? (
                  <button style={styles.primaryButton} onClick={nextStep}>Continue</button>
                ) : (
                  <button 
                    style={styles.primaryButton} 
                    onClick={verifyDNS}
                    disabled={isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Now'}
                  </button>
                )}
              </div>
              {dnsVerified && <p style={styles.successText}>✅ DNS Verified Successfully!</p>}
            </div>
          )}

          {currentStep === 'ConfigureForwarding' && (
            <div style={styles.stepContent}>
              <h2 style={styles.title}>Configure Forwarding</h2>
              <p style={styles.text}>
                Where should we forward emails sent to hello@{domain}?
              </p>
              <div style={styles.inputGroup}>
                <input 
                  type="email" 
                  value={forwardEmail} 
                  onChange={(e) => setForwardEmail(e.target.value)} 
                  placeholder="your.personal@email.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button style={styles.secondaryButton} onClick={prevStep}>Back</button>
                <button 
                  style={styles.primaryButton} 
                  onClick={nextStep}
                  disabled={!forwardEmail.includes('@')}
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}

          {currentStep === 'Done' && (
            <div style={styles.stepContent}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={styles.title}>You're All Set!</h2>
              <p style={styles.text}>
                Your custom email <strong>hello@{domain}</strong> is now configured and will forward to <strong>{forwardEmail}</strong>.
              </p>
              <button style={styles.primaryButton} onClick={() => window.location.href = '/'}>
                Go to Inbox
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '500px',
    overflow: 'hidden'
  },
  progressContainer: {
    height: '6px',
    backgroundColor: '#f3f4f6',
    width: '100%'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.4s ease'
  },
  content: {
    padding: '40px 32px'
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '16px',
    marginTop: 0
  },
  text: {
    color: '#4b5563',
    lineHeight: '1.5',
    marginBottom: '24px'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '200px'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  inputGroup: {
    width: '100%',
    marginBottom: '24px',
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '8px',
    display: 'block'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    gap: '16px'
  },
  codeBlock: {
    backgroundColor: '#1f2937',
    color: '#f3f4f6',
    padding: '16px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    textAlign: 'left',
    width: '100%',
    marginBottom: '24px',
    boxSizing: 'border-box'
  },
  successText: {
    color: '#10b981',
    fontWeight: '500',
    marginTop: '16px'
  }
};
