import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Supplier } from '../../types';
import { ONBOARDING_HELPERS } from '../../services/onboardingService';
import OnboardingHelper from '../../components/onboarding/OnboardingHelper';
import TruckIcon from '../../components/icons/TruckIcon';

interface InventoryOnboardingHelpersProps {
    products: Product[];
    suppliers: Supplier[];
    activeTab: 'products' | 'categories';
}

/**
 * Cross-navigation nudges for first-time users. "Add your first product /
 * category" guidance lives in the empty states themselves (ProductList /
 * CategoryList) so it sits exactly where the emptiness is — this component
 * only carries hints that point SOMEWHERE ELSE, and never more than one at
 * a time to keep the page calm.
 */
const InventoryOnboardingHelpers: React.FC<InventoryOnboardingHelpersProps> = ({
    products,
    suppliers,
    activeTab,
}) => {
    const navigate = useNavigate();

    // Has products but no suppliers → point to the Suppliers section.
    const showSupplierHelper = activeTab === 'products' && products.length > 0 && suppliers.length === 0;

    if (!showSupplierHelper) {
        return null;
    }

    return (
        <div className="px-max mx-auto w-full mt-4 md:mt-0 mb-6">
            <OnboardingHelper
                helperId={ONBOARDING_HELPERS.ADD_SUPPLIERS}
                title="Add your suppliers"
                description="Record who you buy from to raise purchase orders and track restocking."
                icon={<TruckIcon />}
                actionButton={{
                    label: 'Go to Suppliers',
                    onClick: () => navigate('/procure/suppliers')
                }}
                variant="compact"
            />
        </div>
    );
};

export default InventoryOnboardingHelpers;
