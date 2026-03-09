import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hammer, MapPin, Clock, FileText, ChevronLeft, Loader2, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BackButton from '../components/BackButton';

const EditEquipment = () => {
    const { id } = useParams();
    const { fetchWithAuth, t } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        toolName: '',
        location: '',
        pricePerHour: '',
        location: '',
        pricePerHour: '',
        description: '',
        phoneNumber: ''
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetchWithAuth(`/api/equipment/${id}`);
                if (!res.ok) throw new Error('Failed to fetch details');
                const data = await res.json();
                setFormData({
                    toolName: data.toolName,
                    location: data.location,
                    pricePerHour: data.pricePerHour,
                    pricePerHour: data.pricePerHour,
                    description: data.description || '',
                    phoneNumber: data.phoneNumber || ''
                });
            } catch (err) {
                console.error('Error fetching equipment:', err);
                alert('Could not load equipment details');
                navigate('/my-equipment');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetchWithAuth(`/api/equipment/${id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Update failed');

            alert('Equipment updated successfully!');
            navigate('/my-equipment');
        } catch (err) {
            console.error('Error updating equipment:', err);
            alert('Failed to update equipment. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <BackButton />

            <div className="mb-10 mt-6">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Edit Equipment</h1>
                <p className="text-gray-500 mt-2 text-lg italic">Update your tool listing details</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                <div className="p-8 md:p-12 space-y-8">
                    {/* Tool Name */}
                    <div className="space-y-3">
                        <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <Hammer className="w-4 h-4 mr-2 text-red-600" /> Tool Name
                        </label>
                        <input
                            type="text"
                            name="toolName"
                            value={formData.toolName}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Concrete Mixer"
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none text-lg font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Location */}
                        <div className="space-y-3">
                            <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                <MapPin className="w-4 h-4 mr-2 text-red-600" /> Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="City or Area"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none text-lg font-medium"
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-3">
                            <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                <Clock className="w-4 h-4 mr-2 text-red-600" /> Price (₹ per hour)
                            </label>
                            <input
                                type="number"
                                name="pricePerHour"
                                value={formData.pricePerHour}
                                onChange={handleChange}
                                required
                                min="1"
                                placeholder="Hourly rate"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none text-lg font-medium"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-3">
                        <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <Clock className="w-4 h-4 mr-2 text-red-600" /> Contact Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g. 9876543210"
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none text-lg font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <FileText className="w-4 h-4 mr-2 text-red-600" /> Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Describe condition, capacity, etc."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-600 focus:bg-white transition-all outline-none text-lg font-medium resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="p-8 md:p-12 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/my-equipment')}
                        className="px-8 py-4 rounded-xl font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center disabled:opacity-70 disabled:scale-100"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 animate-spin" /> Updating...</>
                        ) : (
                            <><Save className="mr-2" /> Save Changes</>
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
};

export default EditEquipment;
