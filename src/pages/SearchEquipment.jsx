import React, { useState, useEffect } from 'react';
import { Search, Filter, Hammer, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import EquipmentCard from '../components/EquipmentCard';
import BackButton from '../components/BackButton';

const SearchEquipment = () => {
    const { t } = useApp();
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        toolName: '',
        location: '',
        minPrice: '',
        maxPrice: ''
    });

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.toolName) params.append('toolName', filters.toolName);
            if (filters.location) params.append('location', filters.location);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

            const res = await fetch(`/api/equipment/search?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setEquipment(data);
        } catch (err) {
            console.error('Error fetching equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEquipment();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleBookSuccess = (bookedId) => {
        // Instant UI update: Remove the booked item since it's no longer available
        setEquipment(prev => prev.filter(item => item._id !== bookedId));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <BackButton />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('equipment.searchTitle')}</h1>
                    <p className="text-gray-500 mt-2 text-lg">Find the tools you need for your next project</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="toolName"
                            placeholder="Search tools..."
                            value={filters.toolName}
                            onChange={handleFilterChange}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="location"
                            placeholder="Location..."
                            value={filters.location}
                            onChange={handleFilterChange}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            name="minPrice"
                            placeholder="Min Price (₹)"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            name="maxPrice"
                            placeholder="Max Price (₹)"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Results Section */}
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
                            isOwner={false}
                            onBook={handleBookSuccess}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-gray-400 mb-4 flex justify-center">
                        <Hammer size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('equipment.findEmptyHeadline')}</h3>
                    <p className="text-gray-500 mt-2 mb-8">{t('equipment.findEmptySubtext')}</p>
                    <Link
                        to="/equipment/add"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        {t('equipment.findEmptyCTA')}
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SearchEquipment;
