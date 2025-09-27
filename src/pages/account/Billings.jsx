import React, { useState } from 'react';
import Layout from '../../elements/Layout';
import {
    CreditCard,
    Download,
    Smartphone,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    Receipt,
    Zap,
    Shield,
    Star,
    ArrowRight,
    Eye
} from 'lucide-react';

const BillingPage = () => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const paymentMethods = [
        {
            id: 'mpesa',
            name: 'M-Pesa',
            description: 'Pay instantly with your M-Pesa mobile wallet',
            icon: Smartphone,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            popular: true
        },
        {
            id: 'card',
            name: 'Credit/Debit Card',
            description: 'Secure payment with Visa, Mastercard, or other cards',
            icon: CreditCard,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            popular: false
        }
    ];

    const paymentHistory = [
        { id: 1, date: '2025-12-30', amount: 'Ksh. 300', status: 'paid', method: 'M-Pesa', invoice: 'INV-001' },
        { id: 2, date: '2025-11-30', amount: 'Ksh. 300', status: 'paid', method: 'Card', invoice: 'INV-002' },
        { id: 3, date: '2025-10-30', amount: 'Ksh. 300', status: 'overdue', method: 'M-Pesa', invoice: 'INV-003' },
        { id: 4, date: '2025-09-30', amount: 'Ksh. 300', status: 'paid', method: 'Card', invoice: 'INV-004' },
        { id: 5, date: '2025-08-30', amount: 'Ksh. 300', status: 'paid', method: 'M-Pesa', invoice: 'INV-005' }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'text-green-600 bg-green-100';
            case 'overdue':
                return 'text-red-600 bg-red-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="h-4 w-4" />;
            case 'overdue':
                return <AlertCircle className="h-4 w-4" />;
            case 'pending':
                return <Clock className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <Layout 
            title="Billing & Payments"
            subtitle="Manage your subscription and payment history"
        >
            <div className="space-y-8">
                {/* Current Bill Summary Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Current Invoice</h2>
                                <p className="text-purple-100">Professional Plan - Monthly Billing</p>
                            </div>
                            <div className="text-right">
                                <div className="rounded-lg bg-white bg-opacity-10 px-3 py-1 text-sm font-medium mb-2">
                                    Due in 8 days
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Payment Due
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center mb-2">
                                    <Calendar className="h-5 w-5 text-purple-200 mr-2" />
                                    <span className="text-sm text-purple-200">Billing Period</span>
                                </div>
                                <p className="text-lg font-semibold">Dec 1 - Dec 30, 2025</p>
                            </div>

                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center mb-2">
                                    <DollarSign className="h-5 w-5 text-purple-200 mr-2" />
                                    <span className="text-sm text-purple-200">Amount Due</span>
                                </div>
                                <p className="text-2xl font-bold">Ksh. 300</p>
                            </div>

                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center mb-2">
                                    <Clock className="h-5 w-5 text-purple-200 mr-2" />
                                    <span className="text-sm text-purple-200">Due Date</span>
                                </div>
                                <p className="text-lg font-semibold">January 7, 2026</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Zap className="h-5 w-5" />
                                Pay Now
                            </button>
                            <button className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-white border-opacity-20 text-white font-medium rounded-xl hover:bg-white hover:bg-opacity-10 transition-colors">
                                <Download className="h-5 w-5" />
                                Download Invoice
                            </button>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white bg-opacity-5"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Methods */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                                    <p className="text-sm text-gray-600">Choose your preferred payment option</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <div
                                        key={method.id}
                                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                            method.bgColor
                                        } ${method.borderColor}`}
                                        onClick={() => setSelectedPaymentMethod(method.id)}
                                    >
                                        {method.popular && (
                                            <div className="absolute -top-2 -right-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Popular
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${method.bgColor}`}>
                                                    <Icon className={`h-6 w-6 ${method.color}`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                                                    <p className="text-sm text-gray-600">{method.description}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                        </div>

                                        <div className="mt-4">
                                            <button className={`w-full px-4 py-2 text-white font-medium rounded-lg transition-colors ${method.buttonColor}`}>
                                                Pay with {method.name}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Security Notice */}
                            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mt-6">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-900">Secure Payment</h4>
                                    <p className="text-sm text-blue-700">All payments are encrypted and processed securely through our trusted payment partners.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Account Summary</h3>
                                    <p className="text-sm text-gray-600">Your subscription overview</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Plan Details */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Professional Plan</h4>
                                        <p className="text-sm text-gray-600">Monthly billing cycle</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-gray-900">Ksh. 300</div>
                                        <div className="text-sm text-gray-500">per month</div>
                                    </div>
                                </div>

                                {/* Usage Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                                        <div className="text-2xl font-bold text-gray-900">12</div>
                                        <div className="text-sm text-gray-600">Months Active</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                                        <div className="text-2xl font-bold text-gray-900">99.9%</div>
                                        <div className="text-sm text-gray-600">Uptime</div>
                                    </div>
                                </div>

                                {/* Next Billing */}
                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Next Billing Date</span>
                                        <span className="text-sm text-gray-600">January 30, 2026</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Renewal Amount</span>
                                        <span className="text-sm font-semibold text-gray-900">Ksh. 300</span>
                                    </div>
                                </div>

                                {/* Plan Management */}
                                <div className="space-y-3">
                                    <button className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors">
                                        Upgrade Plan
                                    </button>
                                    <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                        Manage Subscription
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Receipt className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                                    <p className="text-sm text-gray-600">Track your billing transactions</p>
                                </div>
                            </div>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                View All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Invoice</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Method</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paymentHistory.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(payment.date).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.invoice}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{payment.amount}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                {getStatusIcon(payment.status)}
                                                <span className="ml-1 capitalize">{payment.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BillingPage;