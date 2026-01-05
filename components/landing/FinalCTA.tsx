import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface FinalCTAProps {
  onStartTrial: (email: string) => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onStartTrial }) => {
  const [email, setEmail] = useState('');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onStartTrial(email);
      setEmail('');
    }
  };

  const features = [
    'Offline-first design',
    'Smartphone barcode scanning',
    'Daily profit tracking',
    'Stock management',
    'Multi-location support',
    'Local customer support'
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Your Business. One Smart System.
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            From small shop to growing enterprise — SalePilot grows with you.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#008060] hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-2">
                  {getFeatureIcon(index)}
                </div>
                <div className="text-sm font-medium text-gray-700">{feature}</div>
              </div>
            ))}
          </div>

          {/* CTA Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-grow px-6 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008060] text-gray-900"
                required
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-[#008060] to-[#00a080] text-white px-8 py-4 rounded-lg font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                Start Free Trial
              </button>
            </div>
            <p className="text-sm text-gray-500">
              No risk. No complicated setup.
            </p>
          </form>

          {/* Footer Metrics */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Designed for small and medium businesses', icon: '🏪' },
                { label: 'Offline-first architecture', icon: '📶' },
                { label: 'Secure local & cloud data sync', icon: '🔒' },
                { label: 'Local support & training', icon: '👥' }
              ].map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl mb-3">{metric.icon}</div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function getFeatureIcon(index: number): string {
  const icons = ['📴', '📱', '💰', '📦', '🏪', '📞'];
  return icons[index] || '✨';
}

export default FinalCTA;