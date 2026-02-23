import React from 'react';
import { BookOpenIcon, ShoppingCartIcon, ArchiveBoxIcon, UsersIcon, CalculatorIcon, HomeIcon } from '../components/icons';

const UserGuidePage: React.FC = () => {
    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-100 p-3 rounded-2xl">
                    <BookOpenIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Guide</h1>
                    <p className="text-gray-500 mt-1">Learn how to use SalePilot effectively</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GuideCard
                    title="Dashboard"
                    icon={<HomeIcon className="w-6 h-6" />}
                    description="Overview of your store's performance."
                    link="#dashboard"
                />
                <GuideCard
                    title="POS Terminal"
                    icon={<ShoppingCartIcon className="w-6 h-6" />}
                    description="Process sales and manage orders."
                    link="#pos"
                />
                <GuideCard
                    title="Inventory Management"
                    icon={<ArchiveBoxIcon className="w-6 h-6" />}
                    description="Manage products, stock, and categories."
                    link="#inventory"
                />
                <GuideCard
                    title="Customer Management"
                    icon={<UsersIcon className="w-6 h-6" />}
                    description="Track customers and their purchase history."
                    link="#customers"
                />
                <GuideCard
                    title="Accounting"
                    icon={<CalculatorIcon className="w-6 h-6" />}
                    description="Manage accounts, expenses, and invoices."
                    link="#accounting"
                />
            </div>

            <div className="space-y-12 mt-12">
                <section id="dashboard" className="scroll-mt-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <HomeIcon className="w-6 h-6 text-blue-500" /> Dashboard
                    </h2>
                    <div className="liquid-glass-card rounded-[2rem] border border-gray-100 p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            The Dashboard provides a real-time overview of your business. Here you can see key metrics such as total sales, recent transactions, and low stock alerts.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Quick Stats:</strong> View daily sales, order counts, and new customers at a glance.</li>
                            <li><strong>Sales Chart:</strong> Visualize your sales trends over time.</li>
                            <li><strong>Recent Activity:</strong> See the latest actions taken by your staff.</li>
                        </ul>
                    </div>
                </section>

                <section id="pos" className="scroll-mt-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ShoppingCartIcon className="w-6 h-6 text-blue-500" /> POS Terminal
                    </h2>
                    <div className="liquid-glass-card rounded-[2rem] border border-gray-100 p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            The Point of Sale (POS) terminal is where you process customer transactions. It is designed for speed and ease of use.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Processing a Sale</h3>
                                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                    <li>Add products to the cart by scanning barcodes or searching by name.</li>
                                    <li>Select a customer (optional) to track their purchase history.</li>
                                    <li>Click "Checkout" to proceed to payment.</li>
                                    <li>Select the payment method (Cash, Card, etc.) and complete the transaction.</li>
                                </ol>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Holding a Cart</h3>
                                <p className="text-gray-600">
                                    You can "Park" a sale if a customer needs to step away. Parked sales can be retrieved later from the "Parked Sales" tab.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="inventory" className="scroll-mt-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ArchiveBoxIcon className="w-6 h-6 text-blue-500" /> Inventory Management
                    </h2>
                    <div className="liquid-glass-card rounded-[2rem] border border-gray-100 p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            Keep track of your stock levels, manage product details, and organize items into categories.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Add Products:</strong> Create new products with details like SKU, price, cost, and stock level.</li>
                            <li><strong>Stock Takes:</strong> Perform regular stock counts to ensure your physical inventory matches the system.</li>
                            <li><strong>Low Stock Alerts:</strong> Set minimum stock levels to receive alerts when items are running low.</li>
                            <li><strong>Barcodes:</strong> Assign barcodes to products for quick scanning at the POS.</li>
                        </ul>
                    </div>
                </section>

                <section id="customers" className="scroll-mt-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-blue-500" /> Customer Management
                    </h2>
                    <div className="liquid-glass-card rounded-[2rem] border border-gray-100 p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            Build relationships with your customers by tracking their purchases and contact information.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Customer Profiles:</strong> Store details like name, phone number, email, and address.</li>
                            <li><strong>Purchase History:</strong> View all past transactions for a specific customer.</li>
                            <li><strong>Store Credit:</strong> Manage store credit for returns or loyalty rewards.</li>
                            <li><strong>Account Balance:</strong> Track outstanding balances for customers with credit accounts.</li>
                        </ul>
                    </div>
                </section>

                <section id="accounting" className="scroll-mt-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CalculatorIcon className="w-6 h-6 text-blue-500" /> Accounting
                    </h2>
                    <div className="liquid-glass-card rounded-[2rem] border border-gray-100 p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            Manage your business finances directly within the app.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li><strong>Chart of Accounts:</strong> Organize your financial accounts (Assets, Liabilities, Equity, Income, Expenses).</li>
                            <li><strong>Journal Entries:</strong> Record manual journal entries for adjustments.</li>
                            <li><strong>Supplier Invoices:</strong> Track bills from your suppliers and record payments.</li>
                            <li><strong>Reports:</strong> Generate financial reports to understand your profitability.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

interface GuideCardProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    link: string;
}

const GuideCard: React.FC<GuideCardProps> = ({ title, icon, description, link }) => {
    return (
        <a
            href={link}
            className="liquid-glass-card rounded-[2rem] block p-6 border border-gray-200 hover: transition- hover:border-blue-200 group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors active:scale-95 transition-all duration-300">
                    {icon}
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </a>
    );
};

export default UserGuidePage;
