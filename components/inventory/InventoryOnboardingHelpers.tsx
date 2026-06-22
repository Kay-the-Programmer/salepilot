import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, Supplier } from '../../types';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ONBOARDING_ACTIONS, ONBOARDING_HELPERS } from '../../services/onboardingService';
import OnboardingHelper from '../../components/onboarding/OnboardingHelper';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';
import TruckIcon from '../../components/icons/TruckIcon';

interface InventoryOnboardingHelpersProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    activeTab: 'products' | 'categories';
    onOpenAddModal: () => void;
    onOpenAddCategoryModal: () => void;
}

const InventoryOnboardingHelpers: React.FC<InventoryOnboardingHelpersProps> = ({
    products,
    categories,
    suppliers,
    activeTab,
    onOpenAddModal,
    onOpenAddCategoryModal
}) => {
    const { completeAction } = useOnboarding();
    const navigate = useNavigate();

    const handleAddFirstProduct = () => {
        onOpenAddModal();
        completeAction(ONBOARDING_ACTIONS.ADDED_FIRST_PRODUCT);
    };

    const handleAddCategory = () => {
        onOpenAddCategoryModal();
        completeAction(ONBOARDING_ACTIONS.CREATED_FIRST_CATEGORY);
    };

    const showProductHelper = activeTab === 'products' && products.length === 0;
    const showCategoryHelper = activeTab === 'categories' && categories.length === 0;
    const showSupplierHelper = activeTab === 'products' && products.length > 0 && suppliers.length === 0;

    if (!showProductHelper && !showCategoryHelper && !showSupplierHelper) {
        return null;
    }

    return (
        <div className="px-max mx-auto w-full mt-4 md:mt-0 mb-6">
            {/* Empty Products tab → add the first product */}
            {activeTab === 'products' && products.length === 0 && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.ADD_FIRST_PRODUCT}
                    title="Add your first product"
                    description="Your inventory is empty. Add a product to start tracking stock levels, set prices, and ring it up at the till."
                    icon={<CubeIcon />}
                    actionButton={{
                        label: 'Add product',
                        onClick: handleAddFirstProduct
                    }}
                    variant="card"
                />
            )}

            {/* Empty Categories tab → create the first category */}
            {activeTab === 'categories' && categories.length === 0 && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.CREATE_CATEGORIES}
                    title="Create your first category"
                    description="Group products into categories so they're faster to find at checkout and clearer in your sales reports."
                    icon={<TagIcon />}
                    actionButton={{
                        label: 'Create category',
                        onClick: handleAddCategory
                    }}
                    variant="card"
                />
            )}

            {/* Has products but no suppliers → point to the Suppliers section */}
            {activeTab === 'products' && products.length > 0 && suppliers.length === 0 && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.ADD_SUPPLIERS}
                    title="Add your suppliers"
                    description="Record who you buy from to raise purchase orders and track restocking."
                    icon={<TruckIcon />}
                    actionButton={{
                        label: 'Go to Suppliers',
                        onClick: () => navigate('/suppliers')
                    }}
                    variant="compact"
                />
            )}
        </div>
    );
};

export default InventoryOnboardingHelpers;
