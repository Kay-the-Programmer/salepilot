import React from 'react';
import { useInView } from 'react-intersection-observer';

const ProductPreview: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: '📱',
      title: 'Scan Product Barcode',
      description: 'Use your phone camera to scan any barcode instantly'
    },
    {
      icon: '📴',
      title: 'Complete Sale Offline',
      description: 'Make sales even when internet is unavailable'
    },
    {
      icon: '🔄',
      title: 'Stock Updates Automatically',
      description: 'Inventory syncs when connection returns'
    },
    {
      icon: '📊',
      title: 'Daily Profit Summary',
      description: 'See exactly what you made each day'
    }
  ];

  return (
    <section ref={ref} id="product" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Your Business, One Simple Dashboard
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              View your products, make sales, scan barcodes, track stock, and see your profit — 
              all in one simple system designed for African businesses.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="liquid-glass-card rounded-[2rem] flex items-start space-x-4 p-4 border border-gray-200 hover: transition-all duration-300"
                >
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`relative transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            {/* Smartphone Mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="bg-gray-900 rounded-[2rem] p-3 shadow-2xl">
                <div className="bg-black rounded-[1.5rem] overflow-hidden">
                  {/* Phone Status Bar */}
                  <div className="bg-gray-900 px-4 py-2 flex justify-between items-center">
                    <span className="text-xs text-white">9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-white">Offline</span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 bg-white min-h-[500px]">
                    {/* Sale in Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">New Sale</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Offline</span>
                      </div>
                      
                      {/* Barcode Scanner Area */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-dashed border-blue-200 rounded-lg p-6 text-center mb-4">
                          <div className="text-3xl mb-2">📱</div>
                          <p className="text-sm font-medium text-gray-700">Tap to scan barcode</p>
                        </div>
                      </div>

                      {/* Cart Items */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">Indomie Noodles</p>
                            <p className="text-xs text-gray-500">Stock: 24 units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">₦200</p>
                            <div className="flex items-center space-x-2">
                              <button className="text-xs">-</button>
                              <span className="text-xs">2</span>
                              <button className="text-xs">+</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Total</span>
                          <span className="text-lg font-bold text-[#008060]">₦400</span>
                        </div>
                        <button className="w-full mt-3 bg-gradient-to-r from-[#008060] to-[#00a080] text-white py-3 rounded-lg font-semibold">
                          Complete Sale
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="liquid-glass-card rounded-[2rem] absolute -bottom-6 -right-6 p-4 border animate-bounce-slow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Sale Recorded</p>
                    <p className="text-[10px] text-gray-500">Will sync when online</p>
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

export default ProductPreview;