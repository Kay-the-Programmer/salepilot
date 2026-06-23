import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { api } from '../../services/api';

interface LandingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  features: string[];
  popular?: boolean;
}

const money = (n: number, c = 'ZMW') => {
  const sym = c === 'USD' ? '$' : c === 'ZMW' ? 'K' : c === 'GBP' ? '£' : c === 'EUR' ? '€' : '';
  const v = (Number.isFinite(n) ? n : 0).toLocaleString();
  return sym ? `${sym}${v}` : `${c} ${v}`;
};

// Shown instantly; replaced by the live catalog prices once they load, so the
// section always matches what the Super Admin has configured.
const FALLBACK: LandingPlan[] = [
  { id: 'plan_basic', name: 'Basic', price: 99, currency: 'ZMW', description: 'Essential tools for small shops', features: ['Up to 100 products', 'Basic sales reports', '1 user account', 'Email support'] },
  { id: 'plan_pro', name: 'Pro', price: 249, currency: 'ZMW', description: 'For growing businesses', features: ['Unlimited products', 'AI assistant', 'Advanced reports', 'Up to 5 users', 'Priority support'], popular: true },
  { id: 'plan_enterprise', name: 'Enterprise', price: 599, currency: 'ZMW', description: 'For large operations', features: ['Everything in Pro', 'SMS messaging', 'Public tracking', 'Unlimited users', 'Dedicated support'] },
];

interface PricingPreviewProps {
  onStartFree: () => void;
}

const PricingPreview: React.FC<PricingPreviewProps> = ({ onStartFree }) => {
  const [plans, setPlans] = useState<LandingPlan[]>(FALLBACK);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    api.get<any[]>('/subscriptions/plans')
      .then((d) => {
        if (Array.isArray(d) && d.length) {
          setPlans(d.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency || 'ZMW',
            description: p.description,
            features: Array.isArray(p.features) ? p.features : [],
            popular: p.id === 'plan_pro',
          })));
        }
      })
      .catch(() => { /* keep the fallback prices */ });
  }, []);

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your core POS is <span className="font-semibold text-[#008060]">free forever</span>. Upgrade to a plan or pay only for the add-ons you need — all prices in Kwacha (K).
          </p>
        </div>

        {/* Free-forever callout */}
        <div className="max-w-3xl mx-auto mb-10 rounded-2xl border-2 border-[#008060]/30 bg-[#008060]/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-gray-900">Free forever — <span className="text-[#008060]">K0</span></div>
            <div className="text-sm text-gray-600">Sales &amp; POS, inventory (up to 100 products), reports and 1 user. No card required.</div>
          </div>
          <button onClick={onStartFree} className="whitespace-nowrap bg-[#008060] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#006a50] transition-all active:scale-95">
            Start Free
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-[#008060] to-[#00a080] text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
                </div>
              )}
              <div className={`h-full bg-white rounded-2xl border-2 ${plan.popular ? 'border-[#008060] shadow-xl' : 'border-gray-200'} p-8 hover:shadow-xl transition-all duration-300`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  {plan.description && <p className="text-gray-600 text-sm mb-4">{plan.description}</p>}
                  <div>
                    <span className="text-4xl font-bold text-gray-900">{money(plan.price, plan.currency)}</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onStartFree}
                  className={`w-full py-3 rounded-lg font-semibold transition-all active:scale-95 ${plan.popular ? 'bg-gradient-to-r from-[#008060] to-[#00a080] text-white hover:shadow-lg' : 'border-2 border-[#008060] text-[#008060] hover:bg-[#008060] hover:text-white'}`}
                >
                  Start 14-day free trial
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 mt-10 text-sm">
          Prefer to pick and choose?{' '}
          <button onClick={onStartFree} className="text-[#008060] font-semibold hover:underline">Build your own plan</button>
          {' '}— pay only for the add-ons you use.
        </p>
      </div>
    </section>
  );
};

export default PricingPreview;
