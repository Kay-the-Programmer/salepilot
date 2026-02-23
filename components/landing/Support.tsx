import React from 'react';
import { useInView } from 'react-intersection-observer';

const Testimonial: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const testimonials = [
    {
      quote: "SalePilot helped me stop guessing my profits. I now know exactly what I make every day — even when internet is off.",
      author: "Retail Business Owner",
      business: "Grocery Store, Lagos",
      avatar: "👨🏾‍💼"
    },
    {
      quote: "The offline feature is a game-changer. We can continue selling during power outages and internet downtime.",
      author: "Pharmacy Manager",
      business: "Pharmacy, Accra",
      avatar: "👩🏾‍⚕️"
    },
    {
      quote: "Starting was so simple. We were up and running in minutes, no expensive equipment needed.",
      author: "Boutique Owner",
      business: "Fashion Store, Nairobi",
      avatar: "👗"
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Business Owners Across Africa
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from entrepreneurs who transformed their businesses with SalePilot
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className={`group transition-all duration-700 delay-${index * 100} ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="liquid-glass-card rounded-[2rem] relative h-full border border-gray-200 p-8 hover: transition-all duration-300">
                {/* Quote Icon */}
                <div className="text-4xl text-gray-200 mb-4">"</div>
                
                {/* Quote */}
                <blockquote className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Stars */}
                <div className="flex mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center pt-6 border-t border-gray-100">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.business}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className={`mt-16 bg-gradient-to-r from-[#008060] to-[#00a080] rounded-2xl p-8 text-white transition-all duration-700 delay-300 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-sm opacity-90">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-90">Support Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">0</div>
              <div className="text-sm opacity-90">Setup Cost</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">5min</div>
              <div className="text-sm opacity-90">Average Setup Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;