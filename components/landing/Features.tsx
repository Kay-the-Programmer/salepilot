import React from 'react';
import { useInView } from 'react-intersection-observer';

const Features: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: '📱',
      title: 'Your Phone Is the POS',
      description: 'Use your smartphone to scan barcodes, make sales, and manage stock. No scanners or special machines required.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📴',
      title: 'Sell Without Internet',
      description: 'SalePilot works fully offline. Sales sync automatically when internet becomes available.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '📊',
      title: 'Know Your Business Daily',
      description: 'Track revenue, profit, losses, and stock movement with clear, simple reports.',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section ref={ref} id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need in One System
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Designed specifically for African SMEs to overcome common business challenges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`group transition-all duration-700 delay-${index * 100} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="relative h-full bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-transparent transition-all duration-300">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-gray-900 group-hover:to-gray-700">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature Benefits */}
                  <ul className="mt-6 space-y-2">
                    {getFeatureBenefits(index).map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

function getFeatureBenefits(index: number): string[] {
  const benefits = [
    ['Camera barcode scanning', 'Receipt printing', 'Customer management', 'Multi-device sync'],
    ['Always available', 'Auto-sync when online', 'Battery efficient', 'No data loss'],
    ['Daily profit reports', 'Stock alerts', 'Sales trends', 'Expense tracking']
  ];
  return benefits[index] || [];
}

export default Features;