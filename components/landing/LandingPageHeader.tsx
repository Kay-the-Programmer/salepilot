import React from "react";
import salepilot from "../../assets/salepilot.png";

interface LandingPageHeaderProps {
  onLogin: () => void;
  onStartFree: () => void;
}

const LandingPageHeader: React.FC<LandingPageHeaderProps> = ({ onLogin, onStartFree }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <img className="w-36 h-auto" src={salepilot} alt="SalePilot Logo" />
            </div>

            {/* <nav className="hidden md:flex items-center space-x-6">
              <a href="#product" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">Product</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">Pricing</a>
              <a href="#retailers" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">For Retailers</a>
              <a href="#wholesalers" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">For Wholesalers</a>
              <a href="#support" className="text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors">Support</a>
            </nav> */}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onLogin}
              className="hidden md:block text-sm font-medium text-gray-700 hover:text-[#008060] transition-colors px-3 py-2"
            >
              Log in
            </button>
            <button
              onClick={onStartFree}
              className="bg-gradient-to-r from-[#008060] to-[#00a080] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg hover:scale-105 transform transition-all duration-300"
            >
              Start Free
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingPageHeader;
