import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import EquipmentForm from '../components/EquipmentForm';
import BackButton from '../components/BackButton';

const AddEquipment = () => {
    const navigate = useNavigate();
    const { fetchWithAuth } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetchWithAuth('/api/equipment/add', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                console.error(`[ADD EQUIPMENT] Server returned status ${res.status}`);
                const contentType = res.headers.get("content-type");
                let message = `Failed to add equipment (Status: ${res.status})`;
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    message = data.message || message;
                } else {
                    const text = await res.text();
                    console.error('[ADD EQUIPMENT] Non-JSON error response:', text);
                }
                throw new Error(message);
            }

            navigate('/equipment/my');
        } catch (err) {
            setError(err.message || 'Failed to add equipment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <BackButton />

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8 md:p-12 border border-gray-50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                        <Hammer size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">List Your Equipment</h1>
                        <p className="text-gray-500">Help others and earn by lending your tools</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <EquipmentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    );
};

export default AddEquipment;
