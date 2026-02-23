import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ShopInfo } from '../../services/shop.service';
import { HiOutlineShoppingBag } from 'react-icons/hi2';

const ShopHomePage: React.FC = () => {
    const { shopInfo } = useOutletContext<{ shopInfo: ShopInfo }>();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <div className="space-y-4 max-w-2xl px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                    Welcome to <span className="text-indigo-600">{shopInfo.settings.name || shopInfo.name}</span>
                </h1>
                <p className="text-xl text-gray-500">
                    Discover our collection of premium quality products.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to={`/shop/${shopInfo.id}/products`}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg transition-colors active:scale-95 transition-all duration-300"
                    >
                        <HiOutlineShoppingBag className="w-5 h-5 mr-2" />
                        Browse Catalog
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ShopHomePage;
