import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const faqs = [
    {
      question: "What is SalePilot?",
      answer: "SalePilot is an offline-first point of sale system that helps businesses sell, track stock, scan barcodes, and grow online and offline. It's designed specifically for African SMEs."
    },
    {
      question: "Do I need internet to use SalePilot?",
      answer: "No. You can sell and track stock completely offline. Internet is only needed for syncing data across devices and accessing online features. All core functions work without internet."
    },
    {
      question: "Do I need special POS equipment?",
      answer: "No. Your smartphone or computer is enough. Barcode scanning works using your phone camera, and you can print receipts with any regular printer."
    },
    {
      question: "Can I start small and grow later?",
      answer: "Yes. Start with one device and upgrade as your business grows. SalePilot scales with you — from single shop to multiple locations."
    },
    {
      question: "Does SalePilot support wholesalers and retailers?",
      answer: "Yes. Retailers can connect with suppliers directly through the platform, and wholesalers can manage bulk sales, inventory, and retailer accounts in one place."
    },
    {
      question: "How secure is my business data?",
      answer: "Your data is stored locally on your device and encrypted. When syncing online, all data is protected with enterprise-grade security. You own your data."
    },
    {
      question: "What happens during power outages?",
      answer: "SalePilot works on mobile devices, so you can continue selling using your smartphone's battery. All sales sync when power and internet return."
    },
    {
      question: "Can I try before I pay?",
      answer: "Yes. Start with a 14-day free trial. No credit card required. Get full access to all features during your trial."
    }
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-4xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Frequently asked questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-2">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`bg-gradient-to-r from-white/5 to-transparent rounded-xl overflow-hidden group hover:from-white/10 transition-all duration-300 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <button 
                onClick={() => toggle(i)}
                className="w-full flex justify-between items-center p-6 text-left group-hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-medium group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text">
                  {faq.question}
                </span>
                <span className={`transform transition-transform duration-300 ${openIndex === i ? 'rotate-45 text-cyan-400' : 'text-gray-400'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }
      `}</style>
    </section>
  );
};

export default FAQ;