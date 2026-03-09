import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ className = "" }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors ${className}`}
        >
            <ArrowLeft className="w-5 h-5" />
            Back
        </button>
    );
};

export default BackButton;
