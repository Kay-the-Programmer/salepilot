import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineArrowRight, HiOutlineCheck, HiOutlineUser, HiOutlinePhone, HiOutlineChatBubbleBottomCenterText, HiOutlineCurrencyDollar, HiOutlineXMark } from 'react-icons/hi2';
import { getCurrentUser } from '../services/authService';

interface RequestWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<void>;
}

const steps = [
    {
        id: 'name',
        question: "Hi there! I'm SalePilot. What should I call you?",
        placeholder: "Enter your name...",
        type: 'text',
        icon: <HiOutlineUser className="w-6 h-6" />,
        subtext: "We'll use this to introduce you to sellers."
    },
    {
        id: 'query',
        question: (name: string) => `Nice to meet you, ${name}! What are you looking for today?`,
        placeholder: "e.g., iPhone 15 Pro, Office Chair...",
        type: 'text',
        icon: <HiOutlineChatBubbleBottomCenterText className="w-6 h-6" />,
        subtext: "Be as specific as you can!"
    },
    {
        id: 'targetPrice',
        question: "What's your ideal budget for this?",
        placeholder: "0.00",
        type: 'number',
        icon: <HiOutlineCurrencyDollar className="w-6 h-6" />,
        subtext: "This helps sellers give you the best matching offers."
    },
    {
        id: 'phone',
        question: "Lastly, what's your phone number?",
        placeholder: "+263...",
        type: 'tel',
        icon: <HiOutlinePhone className="w-6 h-6" />,
        subtext: "We'll text you when you get offers."
    }
];

const RequestWizard: React.FC<RequestWizardProps> = ({ isOpen, onClose, onSubmit }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        query: '',
        targetPrice: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const user = getCurrentUser();
            const initialName = user?.name || '';
            const initialPhone = user?.phone || '';

            setFormData({
                customerName: initialName,
                customerPhone: initialPhone,
                query: '',
                targetPrice: ''
            });
            setIsSuccess(false);

            // Determine starting step
            // If name is present, skip step 0 (name)
            if (initialName) {
                setCurrentStep(1); // Go to query
            } else {
                setCurrentStep(0);
            }

            setTimeout(() => inputRef.current?.focus(), 500);
        }
    }, [isOpen]);

    const handleNext = () => {
        const step = steps[currentStep];
        const value = getStepValue(step.id);

        if (!value) return;

        // Special logic for skipping phone if already present
        let next = currentStep + 1;
        if (next < steps.length && steps[next].id === 'phone' && formData.customerPhone) {
            // Already have phone, skip to submit
            handleSubmit();
            return;
        }

        if (next < steps.length) {
            setCurrentStep(next);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            handleSubmit();
        }
    };

    const getStepValue = (id: string) => {
        switch (id) {
            case 'name': return formData.customerName;
            case 'query': return formData.query;
            case 'targetPrice': return formData.targetPrice;
            case 'phone': return formData.customerPhone;
            default: return '';
        }
    };

    const setStepValue = (id: string, value: string) => {
        switch (id) {
            case 'name': setFormData(prev => ({ ...prev, customerName: value })); break;
            case 'query': setFormData(prev => ({ ...prev, query: value })); break;
            case 'targetPrice': setFormData(prev => ({ ...prev, targetPrice: value })); break;
            case 'phone': setFormData(prev => ({ ...prev, customerPhone: value })); break;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-[#0A2E5C]/90 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
                <HiOutlineXMark className="w-6 h-6" />
            </button>

            <div className="w-full max-w-2xl h-full sm:h-auto overflow-hidden relative flex flex-col items-center justify-center p-6 sm:p-12">

                {/* Progress Bar */}
                {!isSuccess && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10">
                        <div
                            className="h-full bg-[#FF7F27] transition-all duration-500 ease-out shadow-[0_0_20px_rgba(255,127,39,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {isSuccess ? (
                    <div className="text-center animate-in zoom-in duration-700">
                        <div className="w-32 h-32 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)] relative">
                            <HiOutlineCheck className="w-16 h-16" />
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-25"></div>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">You're all set!</h2>
                        <p className="text-slate-300 text-xl font-medium">
                            We've broadcasted your request to our sellers. <br />
                            Expect offers via SMS soon!
                        </p>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center">

                        {/* Question Animated Area */}
                        <div key={currentStep} className="w-full mb-12 animate-in slide-in-from-bottom-8 fade-in duration-700">
                            <div className="flex items-center justify-center mb-6">
                                <div className="p-4 bg-white/10 rounded-3xl text-[#FF7F27] backdrop-blur-md border border-white/10 shadow-xl">
                                    {step.icon}
                                </div>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black text-white text-center mb-4 leading-tight">
                                {typeof step.question === 'function' ? step.question(formData.customerName) : step.question}
                            </h2>
                            <p className="text-slate-400 text-center font-bold uppercase tracking-widest text-xs">
                                {step.subtext}
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="w-full max-w-md space-y-8">
                            <input
                                ref={inputRef}
                                type={step.type}
                                placeholder={step.placeholder}
                                value={getStepValue(step.id)}
                                onChange={(e) => setStepValue(step.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                className="w-full bg-white/5 border-2 border-white/20 rounded-[32px] px-8 py-6 text-2xl font-black text-white placeholder-white/20 focus:outline-none focus:border-[#FF7F27] focus:ring-4 focus:ring-[#FF7F27]/20 transition-all text-center"
                            />

                            <button
                                onClick={handleNext}
                                disabled={!getStepValue(step.id) || isSubmitting}
                                className={`w-full py-6 bg-[#FF7F27] text-white rounded-[32px] font-black text-2xl flex items-center justify-center gap-3 hover:bg-[#E66B1F] transition-all active:scale-95 shadow-2xl shadow-[#FF7F27]/20 ${!getStepValue(step.id) ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100'}`}
                            >
                                {currentStep === steps.length - 1 ? (
                                    isSubmitting ? 'Launching...' : 'Send Request'
                                ) : (
                                    <>
                                        Next
                                        <HiOutlineArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-8 flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-[#FF7F27]' : 'w-2 bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Fun Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF7F27]/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            </div>
        </div>
    );
};

export default RequestWizard;
