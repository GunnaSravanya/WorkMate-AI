import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, MapPin, DollarSign, Calendar, CheckCircle, Clock, Building2, CheckCircle2, Download } from 'lucide-react';
import SalarySlip from '../components/SalarySlip'; // Assuming SalarySlip component exists or is inline
import AIAdvisor from '../components/AIAdvisor';
import AIChatbot from '../components/AIChatbot';
import { triggerSpeak } from '../components/VoiceControls';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to check for valid coordinates
const isValidCoordinate = (lat, lon) => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    return !isNaN(latNum) && !isNaN(lonNum) && latNum >= -90 && latNum <= 90 && lonNum >= -180 && lonNum <= 180;
};

// Component to update map view when coords change
const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        if (isValidCoordinate(lat, lon)) {
            map.setView([lat, lon]);
        }
    }, [lat, lon, map]);
    return null;
};

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { jobs, acceptJob, currentUser, users, t, language } = useApp();
    const job = jobs.find(j => String(j._id || j.id) === String(id));
    const jobCid = job?.contractorId?._id || job?.contractorId;
    const jobWid = job?.workerId?._id || job?.workerId;
    const contractor = job?.contractorId?.name ? job.contractorId : users.find(u => String(u._id || u.id) === String(jobCid));
    const isMyJob = String(jobWid) === String(currentUser?.id);

    const hasSpokenRef = useRef(false);
    const [mapCoords, setMapCoords] = React.useState(null);
    const [mapStatus, setMapStatus] = React.useState('loading'); // loading, found, not-found
    const [isApproximate, setIsApproximate] = React.useState(false);

    useEffect(() => {
        if (job) {
            // Initial coords from job
            if (job.latitude && job.longitude) {
                setMapCoords({ lat: job.latitude, lon: job.longitude });
                setMapStatus('found');
                setIsApproximate(false);
            } else if (job.location) {
                const searchAddress = async (query) => {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
                            setMapStatus('found');
                            return true;
                        }
                        return false;
                    } catch (e) {
                        console.error("Geocoding error:", e);
                        return false;
                    }
                };

                const attemptGeocode = async () => {
                    // 1. Try full address
                    let success = await searchAddress(job.location);
                    if (success) {
                        setIsApproximate(false);
                        return;
                    }

                    // 2. If failed, try simplified address (e.g. city/area)
                    if (job.location.includes(',')) {
                        const parts = job.location.split(',').map(p => p.trim());
                        // Try last 2 parts (usually city, state)
                        if (parts.length >= 2) {
                            success = await searchAddress(parts.slice(-2).join(', '));
                            if (success) {
                                setIsApproximate(true);
                                return;
                            }
                        }
                        // If still failed, try just the last part (State/City)
                        if (parts.length > 0) {
                            success = await searchAddress(parts[parts.length - 1]);
                            if (success) {
                                setIsApproximate(true);
                                return;
                            }
                        }
                    }

                    setMapStatus('not-found');
                };

                attemptGeocode();
            } else {
                setMapStatus('not-found');
            }
        }
    }, [job]);

    useEffect(() => {
        if (job && !hasSpokenRef.current) {
            triggerSpeak(`Job details loaded. ${job.title}, pay is ${job.pay} rupees. Located in ${job.location}`);
            hasSpokenRef.current = true;
        }
    }, [job]);

    if (!job) return <div className="text-gray-900 p-8">Job not found</div>;

    const handleAccept = () => {
        if (currentUser?.role !== 'worker') {
            alert(t('jobDetails.workerOnlyAlert'));
            return;
        }
        acceptJob(job.id);
        navigate('/worker-dashboard');
    };

    const handleDownloadSlip = () => {
        alert("Downloading Salary Slip...");
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" /> {t('jobDetails.back')}
            </button>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'open' ? 'bg-red-50 border-red-200 text-red-700' :
                            job.status === 'accepted' ? 'bg-gray-100 border-gray-200 text-gray-700' :
                                'bg-gray-100 border-gray-200 text-gray-600'
                            }`}>
                            {t(`jobDetails.${job.status}`, job.status.toUpperCase())}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-600">₹{job.pay}</div>
                        <div className="text-sm text-gray-500">{t('jobDetails.perTask')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-semibold">{t('jobDetails.location')}</div>
                            <div className="font-medium">{job.location}</div>

                            {/* Map Display Logic */}
                            {isValidCoordinate(mapCoords?.lat || job.latitude, mapCoords?.lon || job.longitude) ? (
                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 relative z-0">
                                    <div className="h-64 w-full relative">
                                        {isApproximate && (
                                            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-yellow-100/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-yellow-200 shadow-sm z-[1000] flex items-center gap-2">
                                                <span className="text-yellow-700 text-xs">⚠️</span>
                                                <span className="text-xs font-semibold text-yellow-800 whitespace-nowrap">{t('jobDetails.approxLocation')}</span>
                                            </div>
                                        )}
                                        <MapContainer
                                            center={[mapCoords?.lat || job.latitude, mapCoords?.lon || job.longitude]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[mapCoords?.lat || job.latitude, mapCoords?.lon || job.longitude]}>
                                                <Popup>
                                                    {job.location}
                                                    {isApproximate && <div className="text-red-500 text-xs font-bold mt-1">(Approximate Location)</div>}
                                                </Popup>
                                            </Marker>
                                            <RecenterMap lat={mapCoords?.lat || job.latitude} lon={mapCoords?.lon || job.longitude} />
                                        </MapContainer>

                                        <div className="absolute bottom-2 right-2 z-[400] flex flex-col gap-1">
                                            <button
                                                onClick={() => {
                                                    const destLat = mapCoords?.lat || job.latitude;
                                                    const destLon = mapCoords?.lon || job.longitude;
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition((pos) => {
                                                            const userLat = pos.coords.latitude;
                                                            const userLon = pos.coords.longitude;
                                                            const url = `https://www.openstreetmap.org/directions?from=${userLat},${userLon}&to=${destLat},${destLon}`;
                                                            window.open(url, '_blank');
                                                        }, () => {
                                                            const url = `https://www.openstreetmap.org/search?query=${destLat},${destLon}`;
                                                            window.open(url, '_blank');
                                                        });
                                                    }
                                                }}
                                                className="bg-white text-blue-600 px-3 py-1 rounded shadow text-xs font-bold hover:bg-gray-50 flex items-center gap-1 border border-gray-200"
                                            >
                                                <MapPin className="w-3 h-3" /> {t('jobDetails.getDirections')}
                                            </button>
                                        </div>
                                    </div>
                                </div>) : (
                                <div className="text-xs text-gray-400 mt-2 italic">
                                    {mapStatus === 'loading' ? t('jobDetails.loadingMap') :
                                        mapStatus === 'not-found' ? t('jobDetails.locationNotFound') :
                                            t('jobDetails.locationNotAvailable')}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase font-semibold">{t('jobDetails.schedule')}</div>
                            <div className="font-medium">{job.schedule || t('jobDetails.flexible')}</div>
                        </div>
                    </div>
                    {contractor && (
                        <div className="flex items-center gap-3 text-gray-700 col-span-2">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase font-semibold">{t('jobDetails.postedBy')}</div>
                                <div className="font-medium">{contractor.name}</div>
                                {contractor.phone ? (
                                    <a href={`tel:${contractor.phone}`} className="text-sm text-green-600 hover:text-green-700 font-bold flex items-center gap-1 mt-1">
                                        📞 {contractor.phone} ({t('jobDetails.phoneAvailable')})
                                    </a>
                                ) : (
                                    <span className="text-xs text-gray-400">{t('jobDetails.phoneNotAvailable')}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {job.status === 'open' && (
                    <button
                        onClick={handleAccept}
                        className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                    >
                        {t('jobDetails.acceptJob')}
                    </button>
                )}

                {isMyJob && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-red-600" />
                            {t('jobDetails.assignmentStatus')}
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-600 font-medium">Daily Attendance</span>
                                    <span className="text-xs font-bold text-gray-400">
                                        {job.dailyAttendance?.filter(a => a !== null).length || 0} / {job.days} Days
                                    </span>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {(job.dailyAttendance && job.dailyAttendance.length > 0 ? job.dailyAttendance : Array(job.duration || 1).fill({ status: 'pending' })).map((day, idx) => (
                                        <div
                                            key={idx}
                                            title={`Day ${idx + 1}: ${day.status}`}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${day.status === 'present' ? 'bg-green-100 border-green-200 text-green-700' :
                                                day.status === 'absent' ? 'bg-red-100 border-red-200 text-red-700' :
                                                    'bg-gray-50 border-gray-100 text-gray-300'
                                                }`}
                                        >
                                            {idx + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100">
                                <span className="text-gray-600">{t('jobDetails.completion')}</span>
                                <span className={`font-bold ${job.status === 'completed' || job.status === 'paid' ? 'text-red-600' : 'text-gray-400'}`}>
                                    {job.status === 'completed' || job.status === 'paid' ? t('jobDetails.verified') : t('jobDetails.pending')}
                                </span>
                            </div>

                            {job.attendancePercentage !== undefined && (
                                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100">
                                    <span className="text-gray-600 font-medium">Attendance Percentage</span>
                                    <span className={`font-black text-lg ${job.isEligibleForPayment ? 'text-green-600' : 'text-red-500'}`}>
                                        {job.attendancePercentage.toFixed(1)}%
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100">
                                <span className="text-gray-600">{t('jobDetails.payment')}</span>
                                <div className="text-right">
                                    <span className={`font-bold block ${job.status === 'paid' ? 'text-green-600' : 'text-gray-400'}`}>
                                        {job.status === 'paid' ? t('jobDetails.received') : t('jobDetails.pending')}
                                    </span>
                                    {job.calculatedPay && (
                                        <span className="text-xs font-bold text-gray-500">Amount: ₹{job.calculatedPay.toFixed(0)}</span>
                                    )}
                                </div>
                            </div>

                            {(job.status === 'completed' || job.status === 'paid') && (
                                <>
                                    <SalarySlip job={job} worker={currentUser} contractor={contractor} />
                                    <AIAdvisor pay={job.calculatedPay || job.pay} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default JobDetails;
