import React from 'react';
import { useInView } from 'react-intersection-observer';

const ValueProposition: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const cards = [
    {
      icon: '💰',
      title: 'Accurate Sales Tracking',
      description: 'Every sale is recorded instantly, reducing losses and errors. Get real-time insights into your daily performance.',
      stat: '99.9% accuracy'
    },
    {
      icon: '🎯',
      title: 'Know your business daily',
      description: 'Get real-time insights into your daily performance. Know your business daily.',
      stat: 'Daily insights'
    },
    {
      icon: '🔒',
      title: 'Sale Fast',
      description: 'Easy way to sell your products.',
      stat: 'Barcode scanning'
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Smarter Selling Starts Here
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            SalePilot removes the complexity and cost of traditional POS systems, giving you full control of your business — from sales to stock to growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div 
              key={index}
              className={`group transition-all duration-700 delay-${index * 100} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="relative h-full bg-gradient-to-br from-white/10 to-transparent rounded-2xl p-8 border border-white/10 hover:border-white/20 hover:from-white/20 transition-all duration-300">
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium mb-3">
                    {card.stat}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text">
                    {card.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Banner */}
        <div className={`mt-16 bg-gradient-to-r from-[#008060]/20 to-[#00a080]/20 rounded-2xl p-8 border border-[#008060]/30 transition-all duration-700 delay-300 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center lg:text-left">
              <div className="text-2xl font-bold mb-2">Traditional POS</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Expensive hardware
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Needs laptop.
                </li>
              </ul>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">VS</div>
              </div>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="text-2xl font-bold mb-2">SalePilot</div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center justify-end">
                  <span className="mr-2">Zero setup cost</span>
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </li>
                <li className="flex items-center justify-end">
                  <span className="mr-2">Use your smartphone</span>
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function getUseCases(index: number): string[] {
  const useCases = [
    ['Grocery Stores', 'Mini-Marts', 'Convenience Stores'],
    ['Retail Shops', 'Boutiques', 'Fashion Stores'],
    ['Pharmacies', 'Electronics', 'Hardware Stores']
  ];
  return useCases[index] || [];
}

export default ValueProposition;