import React from 'react';
import { useInView } from 'react-intersection-observer';

const UseCases: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const useCases = [
    {
      category: 'Grocery Stores',
      icon: '🛒',
      features: ['Fast barcode scanning', 'Daily profit tracking', 'Supplier management', 'Stock alerts'],
      challenge: 'Managing perishable inventory'
    },
    {
      category: 'Pharmacies',
      icon: '💊',
      features: ['Expiry date tracking', 'Prescription records', 'Insurance billing', 'Stock rotation'],
      challenge: 'Regulatory compliance'
    },
    {
      category: 'Boutiques',
      icon: '👗',
      features: ['Size/color variants', 'Fashion catalog', 'Customer loyalty', 'Seasonal collections'],
      challenge: 'Trend-based inventory'
    },
    {
      category: 'Hardware Shops',
      icon: '🔨',
      features: ['Bulk item management', 'Contractor accounts', 'Project tracking', 'Supplier orders'],
      challenge: 'Diverse product sizes'
    },
    {
      category: 'Mini-Marts',
      icon: '🏪',
      features: ['Quick checkout', 'Receipt printing', 'Price updates', 'Multi-shift reports'],
      challenge: 'High volume transactions'
    },
    {
      category: 'Restaurants',
      icon: '🍽️',
      features: ['Table management', 'Kitchen orders', 'Menu updates', 'Takeaway orders'],
      challenge: 'Peak hour efficiency'
    }
  ];

  return (
    <section id="retailers" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Built for Your Business Type
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            SalePilot adapts to your specific business needs, no matter what you sell
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              ref={index === 0 ? ref : undefined}
              className={`group transition-all duration-700 delay-${index * 100} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="liquid-glass-card rounded-[2rem] relative h-full border border-gray-200 p-8 hover: hover:border-[#008060]/30 transition-all duration-300">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {useCase.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {useCase.category}
                </h3>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-3">SPECIAL FEATURES:</h4>
                  <div className="space-y-2">
                    {useCase.features.map((feature, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenge Solved */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">!</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Common Challenge</p>
                      <p className="text-sm text-gray-600">{useCase.challenge}</p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-6">
                  <button className="text-sm text-[#008060] font-semibold hover:text-[#00a080] transition-colors flex items-center group">
                    View {useCase.category} setup guide
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wholesaler Special Section */}
        <div 
          id="wholesalers"
          className={`mt-20 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-10 border border-blue-200 transition-all duration-700 delay-300 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 font-semibold mb-4">
                <span className="mr-2">🤝</span>
                For Wholesalers & Distributors
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Manage Retailer Networks Efficiently
              </h3>
              <ul className="space-y-3 mb-6">
                {[
                  'Bulk order processing',
                  'Retailer credit management',
                  'Automated invoicing',
                  'Delivery tracking',
                  'Sales team management',
                  'Inventory across warehouses'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95 transition-all duration-300">
                Learn about wholesale features
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <h4 className="font-bold text-gray-900 mb-4">Wholesaler Dashboard Preview</h4>
              <div className="space-y-4">
                {[
                  { label: 'Active Retailers', value: '45', change: '+3' },
                  { label: 'Monthly Volume', value: '₦4.2M', change: '+12%' },
                  { label: 'Pending Orders', value: '18', change: 'Urgent' },
                  { label: 'Stock Level', value: '78%', change: 'Good' }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{stat.value}</div>
                      <div className={`text-xs ${
                        stat.change.includes('+') ? 'text-green-600' : 
                        stat.change === 'Urgent' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {stat.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;