import React from 'react';
import { Product, Category, Supplier } from '../../types';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ONBOARDING_ACTIONS, ONBOARDING_HELPERS } from '../../services/onboardingService';
import OnboardingHelper from '../../components/onboarding/OnboardingHelper';

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

    const handleAddFirstProduct = () => {
        onOpenAddModal();
        completeAction(ONBOARDING_ACTIONS.ADDED_FIRST_PRODUCT);
    };

    const handleAddCategory = () => {
        onOpenAddCategoryModal();
        completeAction(ONBOARDING_ACTIONS.CREATED_FIRST_CATEGORY);
    };

    return (
        <div className="px-4 md:px-6 ">
            {/* Add first product helper */}
            {activeTab === 'products' && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.ADD_FIRST_PRODUCT}
                    title="👋 Add your first product"
                    description="Get started by adding products to your inventory. Click the button below to create your first product and start tracking your stock."
                    actionButton={{
                        label: "Add Product",
                        onClick: handleAddFirstProduct
                    }}
                    variant="card"
                    showWhen={products.length === 0}
                />
            )}

            {/* Create categories helper */}
            {activeTab === 'categories' && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.CREATE_CATEGORIES}
                    title="📂 Organize with categories"
                    description="Create categories to organize your products and make them easier to find. Categories help you group similar items together."
                    actionButton={{
                        label: "Create Category",
                        onClick: handleAddCategory
                    }}
                    variant="card"
                    showWhen={categories.length === 0}
                />
            )}

            {/* Add suppliers helper */}
            {activeTab === 'products' && products.length > 0 && (
                <OnboardingHelper
                    helperId={ONBOARDING_HELPERS.ADD_SUPPLIERS}
                    title="🏢 Track your suppliers"
                    description="Add suppliers to track where your products come from and manage purchase orders more efficiently."
                    variant="compact"
                    showWhen={suppliers.length === 0}
                />
            )}
        </div>
    );
};

export default InventoryOnboardingHelpers;
