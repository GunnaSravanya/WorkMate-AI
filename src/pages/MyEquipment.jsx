import React, { useState, useEffect } from 'react';
import { Hammer, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import EquipmentCard from '../components/EquipmentCard';
import BackButton from '../components/BackButton';

const MyEquipment = () => {
    const { currentUser, fetchWithAuth, t } = useApp();
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyEquipment = async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const res = await fetchWithAuth(`/api/equipment/owner/${currentUser.id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setEquipment(data);
        } catch (err) {
            console.error('Error fetching my equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (id) => {
        try {
            const res = await fetchWithAuth(`/api/equipment/availability/${id}`, {
                method: 'PATCH'
            });
            if (!res.ok) throw new Error('Failed to update');
            const data = await res.json();
            setEquipment(prev => prev.map(item => item._id === id ? data : item));
        } catch (err) {
            console.error('Error toggling availability:', err);
            alert('Failed to update status');
        }
    };

    useEffect(() => {
        fetchMyEquipment();
    }, [currentUser]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <BackButton />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('equipment.myTitle')}</h1>
                    <p className="text-gray-500 mt-2 text-lg">Manage the tools you've listed for lending</p>
                </div>

                <a href="/equipment/add" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-red-300 transition-all flex items-center justify-center">
                    <Plus className="mr-2 text-xl" /> List New Equipment
                </a>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            ) : equipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {equipment.map(item => (
                        <EquipmentCard
                            key={item._id}
                            equipment={item}
                            isOwner={true}
                            onToggleAvailability={handleToggleAvailability}
                            onDelete={(id) => {
                                setEquipment(prev => prev.filter(item => item._id !== id && item.id !== id));
                            }}
                            onUpdateRental={(eqId, field, value) => {
                                setEquipment(prev => prev.map(item => {
                                    if (item._id === eqId || item.id === eqId) {
                                        const updatedRental = { ...item.currentRental, [field]: value };

                                        // If all checklist items are done, the item becomes available and rental vanishes (or status changes)
                                        // But for the UI, let's just update the local state
                                        if (updatedRental.equipmentGiven && updatedRental.equipmentReturned && updatedRental.paymentDone) {
                                            return { ...item, available: true, currentRental: null };
                                        }

                                        return { ...item, currentRental: updatedRental };
                                    }
                                    return item;
                                }));
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-200 mb-6 flex justify-center">
                        <Hammer size={64} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{t('equipment.myEmptyHeadline')}</h3>
                    <p className="text-gray-500 mt-2 mb-8">{t('equipment.myEmptySubtext')}</p>
                    <a href="/equipment/add" className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-red-300 transition-all inline-flex items-center">
                        <Plus className="mr-2" /> {t('equipment.myEmptyCTA')}
                    </a>
                </div>
            )}
        </div>
    );
};

export default MyEquipment;
