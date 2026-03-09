import { MapPin, Phone, Clock, CheckCircle2, XCircle, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EquipmentCard = ({ equipment, onToggleAvailability, isOwner, onBook, onUpdateRental, onDelete }) => {
    const { t, fetchWithAuth, currentUser } = useApp();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingRental, setUpdatingRental] = useState(null);
    const { _id, toolName, location, pricePerHour, available, description, owner, currentRental, phoneNumber } = equipment;

    const handleEdit = () => {
        navigate(`/equipment/edit/${_id || equipment.id}`);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;

        setDeleting(true);
        try {
            const res = await fetchWithAuth(`/api/equipment/${_id || equipment.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            if (onDelete) onDelete(_id || equipment.id);
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete listing');
        } finally {
            setDeleting(false);
        }
    };

    const handleChecklistChange = async (field, value) => {
        if (!currentRental?._id && !currentRental?.id) return;

        const rentalId = currentRental._id || currentRental.id;
        setUpdatingRental(field);
        try {
            const res = await fetchWithAuth(`/api/equipment/rental-status/${rentalId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ field, value })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update status');
            }

            if (onUpdateRental) onUpdateRental(_id, field, value);
        } catch (err) {
            console.error('Update status error:', err);
            alert(err.message);
        } finally {
            setUpdatingRental(null);
        }
    };

    const handleRentNow = async () => {
        if (!available || booking) return;

        setBooking(true);
        try {
            const res = await fetchWithAuth(`/api/equipment/book/${_id}`, {
                method: 'POST'
            });

            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error('Non-JSON response received:', text);
                throw new Error('Server returned an invalid response format (HTML). Please ensure the backend is running and routes are correct.');
            }

            if (!res.ok) {
                throw new Error(data.message || 'Booking failed');
            }

            alert("Booking confirmed successfully!");
            if (onBook) onBook(_id);
        } catch (err) {
            console.error('Booking error:', err);
            alert(err.message || "Something went wrong during booking.");
        } finally {
            setBooking(false);
        }
    };

    // Correct status logic
    let statusLabel = "Available";
    let statusClass = "bg-green-100 text-green-700";

    if (currentRental) {
        statusLabel = "Booked";
        statusClass = "bg-red-100 text-red-700";
    } else if (!available) {
        statusLabel = "Unavailable";
        statusClass = "bg-gray-100 text-gray-700";
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden">
            {deleting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{toolName}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{description}</p>

            <div className="space-y-2 mb-6 text-sm text-gray-500">
                <div className="flex items-center">
                    <MapPin className="mr-2 text-red-500 w-4 h-4" />
                    <span>{location}</span>
                </div>
                <div className="flex items-center">
                    <Clock className="mr-2 text-red-500 w-4 h-4" />
                    <span>₹{pricePerHour} / hour</span>
                </div>
                {phoneNumber && (
                    <div className="flex items-center text-sm font-bold text-gray-600 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="bg-red-100 text-red-600 p-1.5 rounded-md mr-2">
                            <Phone className="w-3 h-3" />
                        </span>
                        {t('common.contact') || 'Contact'}: {phoneNumber}
                    </div>
                )}
                {owner && !isOwner && (
                    <div className="flex items-center">
                        <span className="font-medium text-gray-700 mr-2">Owner:</span>
                        <span>{owner.name}</span>
                    </div>
                )}
                {isOwner && currentRental && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col mb-3">
                            <span className="font-bold text-gray-900 mb-1">Booked by:</span>
                            <div className="pl-2 border-l-2 border-red-200">
                                <p className="text-red-700 font-medium">{currentRental.renter?.name || 'Unknown User'}</p>
                                <p className="text-gray-500 text-sm">{currentRental.renter?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentRental.equipmentGiven}
                                    onChange={(e) => handleChecklistChange('equipmentGiven', e.target.checked)}
                                    disabled={updatingRental === 'equipmentGiven'}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className={`ml-2 font-medium ${currentRental.equipmentGiven ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    Equipment Given
                                </span>
                                {updatingRental === 'equipmentGiven' && <Loader2 className="ml-2 w-3 h-3 animate-spin text-red-500" />}
                            </label>

                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentRental.equipmentReturned}
                                    onChange={(e) => handleChecklistChange('equipmentReturned', e.target.checked)}
                                    disabled={updatingRental === 'equipmentReturned'}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className={`ml-2 font-medium ${currentRental.equipmentReturned ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    Equipment Returned
                                </span>
                                {updatingRental === 'equipmentReturned' && <Loader2 className="ml-2 w-3 h-3 animate-spin text-red-500" />}
                            </label>

                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentRental.paymentDone}
                                    onChange={(e) => handleChecklistChange('paymentDone', e.target.checked)}
                                    disabled={updatingRental === 'paymentDone'}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className={`ml-2 font-medium ${currentRental.paymentDone ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    Payment Received
                                </span>
                                {updatingRental === 'paymentDone' && <Loader2 className="ml-2 w-3 h-3 animate-spin text-red-500" />}
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {!isOwner ? (
                    <button
                        onClick={handleRentNow}
                        disabled={!available || booking || currentRental}
                        className={`w-full py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center ${available && !booking && !currentRental
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {booking ? (
                            <><Loader2 className="mr-2 animate-spin" /> Processing...</>
                        ) : (
                            statusLabel === "Available" ? t('equipment.rentNow') : statusLabel
                        )}
                    </button>
                ) : (
                    <>
                        {available && !currentRental ? (
                            <button
                                onClick={() => onToggleAvailability(_id)}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold border-2 border-red-600 text-red-600 hover:bg-red-50 transition-colors`}
                            >
                                <XCircle className="mr-2 w-5 h-5" /> {t('equipment.markUnavailable')}
                            </button>
                        ) : !available && !currentRental ? (
                            <button
                                onClick={() => onToggleAvailability(_id)}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors`}
                            >
                                <CheckCircle2 className="mr-2 w-5 h-5" /> {t('equipment.markAvailable')}
                            </button>
                        ) : (
                            <div className="w-full text-center py-2 text-gray-400 text-xs font-bold uppercase tracking-widest border-t border-gray-50 pt-4">
                                Currently Under Rental
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-semibold"
                            >
                                <Edit2 className="mr-2 w-4 h-4" /> {t('equipment.edit')}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-sm font-semibold"
                            >
                                {deleting ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Trash2 className="mr-2 w-4 h-4" />} {t('equipment.delete')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EquipmentCard;
