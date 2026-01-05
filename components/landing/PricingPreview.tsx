import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

const PricingPreview: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small shops',
      price: { monthly: '₦0', annual: '₦0' },
      period: { monthly: 'Free forever', annual: 'Free forever' },
      features: [
        '1 device',
        'Offline sales',
        'Barcode scanning',
        'Basic reports',
        'Email support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Business',
      description: 'Growing businesses',
      price: { monthly: '₦2,500', annual: '₦25,000' },
      period: { monthly: 'per month', annual: 'per year' },
      features: [
        '3 devices',
        'Online store',
        'Advanced reports',
        'Supplier network',
        'Priority support',
        'WhatsApp support',
        'Multi-location'
      ],
      cta: 'Start 14-Day Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'Large businesses & wholesalers',
      price: { monthly: '₦7,500', annual: '₦75,000' },
      period: { monthly: 'per month', annual: 'per year' },
      features: [
        'Unlimited devices',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'On-site training',
        'Custom reporting',
        'White-label options'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section id="pricing-details" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Start free, upgrade as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual (Save 17%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              ref={index === 0 ? ref : undefined}
              className={`relative transition-all duration-700 delay-${index * 100} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#008060] to-[#00a080] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`h-full bg-white rounded-2xl border-2 ${
                plan.popular 
                  ? 'border-[#008060] shadow-xl' 
                  : 'border-gray-200'
              } p-8 hover:shadow-xl transition-all duration-300`}>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price[billingCycle]}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {plan.period[billingCycle]}
                    </span>
                  </div>
                  
                  {billingCycle === 'annual' && plan.name !== 'Starter' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ₦{plan.name === 'Business' ? '5,000' : '15,000'} yearly
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#008060] to-[#00a080] text-white hover:shadow-lg'
                    : plan.name === 'Starter'
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'border-2 border-[#008060] text-[#008060] hover:bg-[#008060] hover:text-white'
                }`}>
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* All Plans Include */}
        <div className={`mt-20 bg-gray-50 rounded-2xl p-10 transition-all duration-700 delay-300 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">
            All Plans Include
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '📱', label: 'Mobile App', desc: 'iOS & Android' },
              { icon: '📶', label: 'Offline Mode', desc: 'Always available' },
              { icon: '📦', label: 'Inventory', desc: 'Unlimited products' },
              { icon: '📊', label: 'Basic Reports', desc: 'Sales & profit' },
              { icon: '🔒', label: 'Data Security', desc: 'Local encryption' },
              { icon: '🔄', label: 'Auto Sync', desc: 'When online' },
              { icon: '📧', label: 'Email Support', desc: '24-48 hour response' },
              { icon: '🎥', label: 'Video Guides', desc: 'Self-help library' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="font-semibold text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Need help choosing a plan?
          </p>
          <button className="text-[#008060] font-semibold hover:text-[#00a080] transition-colors">
            Compare all features →
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;