import React from 'react';
import { User } from '../types';
import { AiChat } from '../components/ai/AiChat';

interface QuickViewProps {
    user: User | null;
}

const QuickView: React.FC<QuickViewProps> = ({ user }) => {
    return (
        <AiChat
            userName={user?.name}
            isFullScreen={true}
        />
    );
};

export default QuickView;
