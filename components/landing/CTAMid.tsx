import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface CTAMidProps {
  onStartTrial: (email: string) => void;
}

const CTAMid: React.FC<CTAMidProps> = ({ onStartTrial }) => {
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

  const benefits = [
    'No expensive hardware needed',
    'Works fully offline',
    'Set up in minutes',
    'Cancel anytime',
    'Free 14-day trial'
  ];

  return (
    <section ref={ref} id="pricing" className="py-24 bg-gradient-to-br from-[#008060] via-[#00a080] to-emerald-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Start Selling Smarter Today
          </h2>
          <p className="text-xl opacity-90 mb-10">
            Join hundreds of businesses that have simplified their sales and grown their profits
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center justify-center space-x-2 p-3 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all active:scale-95 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-grow px-6 py-4 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white text-gray-900"
                required
              />
              <button 
                type="submit"
                className="bg-white text-[#008060] px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                Start Free Trial
              </button>
            </div>
            <p className="text-sm opacity-80">
              Set up in minutes. No hardware needed.
            </p>
          </form>

          {/* Risk Reversal */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="inline-flex items-center space-x-4 px-6 py-3 bg-white/10 rounded-full">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#008060] text-xl">🔒</span>
              </div>
              <div className="text-left">
                <div className="font-bold">No Risk Trial</div>
                <div className="text-sm opacity-80">14 days free • No credit card required</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTAMid;