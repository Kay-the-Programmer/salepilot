import React from 'react';
import { useInView } from 'react-intersection-observer';

const HowItWorks: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const steps = [
    {
      number: '1',
      title: 'Install SalePilot',
      description: 'Download the app on your smartphone or access via web browser.',
      icon: '📲',
      time: '2 minutes'
    },
    {
      number: '2',
      title: 'Add Products & Scan Barcodes',
      description: 'Use your phone camera to scan products and build your inventory.',
      icon: '📸',
      time: '5 minutes'
    },
    {
      number: '3',
      title: 'Start Selling — Even Offline',
      description: 'Make your first sale immediately. Works without internet connection.',
      icon: '💰',
      time: 'Instant'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Get Started in Minutes, Not Days
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            No complicated setup. No expensive hardware. Just start selling.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#008060] via-[#00a080] to-emerald-500 -translate-y-1/2"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                ref={index === 0 ? ref : undefined}
                className={`relative transition-all duration-700 delay-${index * 100} ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 text-center group">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#008060] to-[#00a080] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {step.number}
                    </div>
                  </div>

                  <div className="text-5xl mb-6 mt-2">{step.icon}</div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    {step.description}
                  </p>

                  {/* Time Indicator */}
                  <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{step.time}</span>
                  </div>

                  {/* Visual Indicators */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <svg className="w-8 h-8 text-[#00a080]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Video Preview */}
        <div className={`mt-20 transition-all duration-700 delay-300 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10">
                <h3 className="text-2xl font-bold text-white mb-4">
                  See It in Action
                </h3>
                <ul className="space-y-3 mb-6">
                  {[
                    'Watch a real business set up in 5 minutes',
                    'See offline sales in action',
                    'Learn barcode scanning with phone camera',
                    'Understand daily profit tracking'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Watch Demo Video
                </button>
              </div>
              <div className="bg-gray-800 flex items-center justify-center p-10">
                <div className="relative w-full max-w-md">
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">▶️</div>
                      <div className="text-white font-semibold">Quick Start Guide</div>
                      <div className="text-gray-400 text-sm mt-2">2:45 minutes</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-[#008060] to-[#00a080] text-white px-4 py-2 rounded-lg">
                    Free to watch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;