import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, DollarSign, Search } from 'lucide-react';
import SalarySlip, { SignatureCanvas } from '../components/SalarySlip';
import AIAdvisor from '../components/AIAdvisor';
import LoanEligibilityForm from '../components/LoanEligibilityForm';
import { triggerSpeak } from '../components/VoiceControls';
import VoiceInput from '../components/VoiceInput';

const WorkerDashboard = () => {
    const { jobs, currentUser, notifications, addManualJob, schemesData, financeData, t } = useApp();
    const [activeTab, setActiveTab] = useState('available'); // available, my-jobs, experience, schemes
    const [filterSkill, setFilterSkill] = useState('');
    const [manualExp, setManualExp] = useState({
        workplace: '',
        duration: '',
        amount: '',
        skill: '',
        workerId: '',
        contractorName: ''
    });
    const [workerSig, setWorkerSig] = useState(null);
    const [contractorSig, setContractorSig] = useState(null);
    const [evidenceImage, setEvidenceImage] = useState(null);
    const [showAdvice, setShowAdvice] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showLoanPredictor, setShowLoanPredictor] = useState(false);

    // Call Verification State
    const [verificationMethod, setVerificationMethod] = useState('image'); // 'image' or 'call'
    const [contractorPhone, setContractorPhone] = useState('');
    const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'initiating', 'calling', 'verified', 'failed'
    const [callError, setCallError] = useState('');
    const [isMockCall, setIsMockCall] = useState(false);
    const [verificationId, setVerificationId] = useState(null);

    // Scheme Search State
    const { getRecommendedSchemes, searchSchemes } = useApp();
    const [schemeSearch, setSchemeSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingSchemes, setIsSearchingSchemes] = useState(false);
    const [selectedSchemeData, setSelectedSchemeData] = useState(null);

    const totalIncome = jobs
        .filter(j => {
            const jWid = j.workerId?._id || j.workerId;
            return String(jWid) === String(currentUser?.id) && (j.status === 'paid' || j.status === 'completed');
        })
        .reduce((sum, j) => sum + (Number(j.calculatedPay || j.pay) || 0), 0);

    const [showBreakdown, setShowBreakdown] = useState(false);

    const handleSchemeClick = (schemeName, data = null) => {
        setSelectedScheme(schemeName);
        if (data) {
            setSelectedSchemeData(data);
        } else {
            // Find in current schemesData
            const curatedData = schemesData[schemeName];
            if (curatedData) {
                const translated = t(`schemes.list.${schemeName}`);
                setSelectedSchemeData({
                    scheme_name: (translated && translated.title) || schemeName,
                    description: (translated && translated.simple) || curatedData.simple,
                    benefits: (translated && translated.benefits) || curatedData.benefits,
                    documents: (translated && translated.docs) || curatedData.docs,
                    threshold: curatedData.threshold
                });
            }
        }
    };

    const handleBackFromScheme = () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSelectedScheme(null);
        setSelectedSchemeData(null);
    };

    const handleSchemeSearch = async (val) => {
        setSchemeSearch(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearchingSchemes(true);
        const results = await searchSchemes(val);
        setSearchResults(results);
        setIsSearchingSchemes(false);
    };

    const readAloud = (text) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            triggerSpeak(text);
            setIsSpeaking(true);
        }
    };

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, []);

    const handleGenerateSlip = async () => {
        // Save to My Jobs with workerId so it shows up in "My Jobs" tab
        await addManualJob({
            title: manualExp.workplace,
            skill: manualExp.skill,
            location: manualExp.workplace,
            pay: parseInt(manualExp.amount),
            days: parseInt(manualExp.duration) || 1,
            schedule: `${manualExp.duration} Days`,
            workerId: currentUser?.id,
            workerIdManual: manualExp.workerId,
            status: 'paid'
        });

        // Show financial advice
        setShowAdvice(true);

        // Reset the form after successful generation
        setManualExp({
            workplace: '',
            duration: '',
            amount: '',
            skill: '',
            workerId: ''
        });
        setEvidenceImage(null);
        setCallStatus('idle');
        setContractorPhone('');
        setWorkerSig(null);
        setContractorSig(null);
    };

    const handleStartVerificationCall = async () => {
        if (!contractorPhone) {
            setCallError('Please enter contractor phone number');
            return;
        }

        setCallStatus('initiating');
        setCallError('');
        setIsMockCall(false);

        try {
            const response = await fetch('http://localhost:5000/api/verification/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerName: currentUser?.name,
                    workerId: manualExp.workerId,
                    jobRole: manualExp.skill,
                    contractorPhone,
                    startDate: 'Recent',
                    endDate: 'Recent',
                    wageAmount: manualExp.amount
                })
            });

            const data = await response.json();

            if (data.success) {
                setCallStatus('calling');
                setVerificationId(data.data.id);
                if (data.message && data.message.includes('Mock Mode')) {
                    setIsMockCall(true);
                }
                // Start polling for status
                startPollingStatus(data.data.id);
            } else {
                setCallStatus('failed');
                setCallError(data.message);
            }
        } catch (err) {
            setCallStatus('failed');
            setCallError('Could not connect to verification server');
        }
    };

    const startPollingStatus = (id) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/verification/${id}`);
                const data = await response.json();

                if (data.success) {
                    const status = data.data.status;
                    const result = data.data.response;

                    if (result === 1) {
                        setCallStatus('verified');
                        clearInterval(interval);
                    } else if (result === 2) {
                        setCallStatus('failed');
                        setCallError('Contractor denied the employment details.');
                        clearInterval(interval);
                    } else if (status === 'completed' && result === null) {
                        setCallStatus('failed');
                        setCallError('Call completed but no response was received.');
                        clearInterval(interval);
                    } else if (status === 'failed') {
                        setCallStatus('failed');
                        setCallError('The call could not be completed.');
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error('Error polling status:', err);
            }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(interval), 120000);
    };

    const myJobs = jobs.filter(job => {
        const jWid = job.workerId?._id || job.workerId;
        return String(jWid) === String(currentUser?.id);
    });

    // Improved search logic: Case insensitive and partial match
    // Mock data might contain 'Plumber', filter might be 'plumb'
    const availableJobs = jobs.filter(job => {
        // Exclude jobs I have already accepted (check if I have a child job pointing to this parent)
        const hasAccepted = jobs.some(j =>
            String(j.workerId?._id || j.workerId) === String(currentUser?.id) &&
            String(j.parentJobId) === String(job.id)
        );

        return job.status === 'open' &&
            !hasAccepted &&
            (!filterSkill || job.skill.toLowerCase().includes(filterSkill.toLowerCase()) || job.title.toLowerCase().includes(filterSkill.toLowerCase()));
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
                <p className="text-gray-500 mt-1">Find jobs that match your skills</p>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wider">New Notifications</h3>
                    <div className="space-y-2">
                        {notifications.map(n => (
                            <div key={n.id} className="flex items-center gap-2 text-red-800 text-sm">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                {n.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeTab === 'available' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {t('nav.availableJobs')}
                    {activeTab === 'available' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-[0_-4px_10px_rgba(220,38,38,0.2)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('my-jobs')}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeTab === 'my-jobs' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {t('nav.myJobs')}
                    {activeTab === 'my-jobs' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-[0_-4px_10px_rgba(220,38,38,0.2)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('experience')}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeTab === 'experience' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {t('nav.experienceSlips')}
                    {activeTab === 'experience' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-[0_-4px_10px_rgba(220,38,38,0.2)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('schemes')}
                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${activeTab === 'schemes' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {t('nav.schemes')}
                    {activeTab === 'schemes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-[0_-4px_10px_rgba(220,38,38,0.2)]" />}
                </button>
            </div>

            {activeTab === 'available' && (
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by skill or title..."
                            className="input-field pl-9 py-2 rounded-full bg-white border-gray-300 focus:border-red-500"
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {(activeTab === 'available' || activeTab === 'my-jobs') && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(activeTab === 'available' ? availableJobs : myJobs).slice().reverse().map(job => (
                        <Link key={job.id} to={`/job/${job.id}`} className="glass-card bg-white hover:border-red-300 group transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">{job.title}</h3>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{job.skill}</span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {job.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-gray-700">₹</span> {job.pay}
                                </div>
                            </div>

                            {activeTab === 'my-jobs' && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${job.status === 'completed' ? 'bg-yellow-100 text-yellow-700' :
                                            job.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {job.status.toUpperCase()}
                                        </span>
                                        <div className="text-[10px] items-center gap-1 font-bold text-gray-400 uppercase">
                                            {job.dailyAttendance?.filter(a => a !== null).length || 0} / {job.days} Days
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-1 mb-4 overflow-hidden">
                                        <div
                                            className="bg-red-500 h-full transition-all duration-500"
                                            style={{ width: `${((job.dailyAttendance?.filter(a => a !== null).length || 0) / job.days) * 100}%` }}
                                        />
                                    </div>

                                    {(job.status === 'completed' || job.status === 'paid') && (
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Attendance</span>
                                                <span className={`text-sm font-bold ${job.isEligibleForPayment ? 'text-green-600' : 'text-red-600'}`}>
                                                    {job.attendancePercentage?.toFixed(1) || 0}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Final Pay</span>
                                                <span className="text-sm font-black text-gray-900">₹{job.calculatedPay?.toFixed(0) || job.pay}</span>
                                            </div>
                                            <SalarySlip job={job} worker={currentUser} />
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <Link to={`/job-details/${job.id}`} className="text-xs font-bold text-red-600 hover:text-red-700">
                                            View Full Details
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </Link>
                    ))}

                    {(activeTab === 'available' ? availableJobs : myJobs).length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            No jobs found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'experience' && (
                <div className="max-w-2xl mx-auto">
                    <div className="flex gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{t('workerDashboard.totalEarnings')}</p>
                            <p className="text-2xl font-black text-gray-900">₹{totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{t('workerDashboard.jobsCompleted')}</p>
                            <p className="text-2xl font-black text-gray-900">{jobs.filter(j => {
                                const jWid = j.workerId?._id || j.workerId;
                                return String(jWid) === String(currentUser?.id) && j.status === 'paid';
                            }).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Add Work Experience</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
                                <input type="text" disabled className="input-field bg-gray-50 text-gray-500" value={currentUser?.name || ''} />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Worker ID</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter your Worker ID (e.g. W12345)"
                                    value={manualExp.workerId}
                                    onChange={e => setManualExp({ ...manualExp, workerId: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contractor Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter Contractor/Employer Name"
                                    value={manualExp.contractorName}
                                    onChange={e => setManualExp({ ...manualExp, contractorName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <VoiceInput
                                    id="workplace"
                                    label="Workplace / Project Name"
                                    value={manualExp.workplace}
                                    onChange={e => setManualExp({ ...manualExp, workplace: e.target.value })}
                                    type="text"
                                    placeholder={t('workerDashboard.workplacePlace')}
                                    contextHelp={t('workerDashboard.workplacePlace')}
                                    className="input-field-voice"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <VoiceInput
                                        id="duration"
                                        label="Days Worked"
                                        value={manualExp.duration}
                                        onChange={e => setManualExp({ ...manualExp, duration: e.target.value })}
                                        type="number"
                                        placeholder={t('workerDashboard.durationPlace')}
                                        contextHelp={t('workerDashboard.durationPlace')}
                                        className="input-field-voice"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <VoiceInput
                                        id="amount"
                                        label="Salary Received (₹)"
                                        value={manualExp.amount}
                                        onChange={e => setManualExp({ ...manualExp, amount: e.target.value })}
                                        type="number"
                                        placeholder={t('workerDashboard.amountPlace')}
                                        contextHelp={t('workerDashboard.amountPlace')}
                                        className="input-field-voice"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <VoiceInput
                                    id="skill"
                                    label="Your Role"
                                    value={manualExp.skill}
                                    onChange={e => setManualExp({ ...manualExp, skill: e.target.value })}
                                    type="text"
                                    placeholder={t('workerDashboard.skillPlace')}
                                    contextHelp={t('workerDashboard.skillPlace')}
                                    className="input-field-voice"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 border-y border-gray-100 mb-4">
                                <SignatureCanvas
                                    label="Worker Signature"
                                    onSave={setWorkerSig}
                                    signature={workerSig}
                                    declaration="I hereby confirm the receipt of the payment as detailed in this payslip."
                                />
                                <SignatureCanvas
                                    label="Contractor Signature"
                                    onSave={setContractorSig}
                                    signature={contractorSig}
                                    declaration="I hereby confirm the disbursement of the payment as detailed in this payslip."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('workerDashboard.verifyMethod')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setVerificationMethod('image')}
                                        className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${verificationMethod === 'image' ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${verificationMethod === 'image' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            📷
                                        </div>
                                        {t('workerDashboard.uploadPhoto')}
                                    </button>
                                    <button
                                        onClick={() => setVerificationMethod('call')}
                                        className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${verificationMethod === 'call' ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${verificationMethod === 'call' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            📞
                                        </div>
                                        {t('workerDashboard.aiCall')}
                                    </button>
                                </div>
                            </div>

                            {/* Image Verification Section */}
                            {verificationMethod === 'image' && (
                                <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="file"
                                        id="evidence-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setEvidenceImage(URL.createObjectURL(file));
                                        }}
                                    />
                                    <label htmlFor="evidence-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        {evidenceImage ? (
                                            <div className="relative w-full h-40">
                                                <img src={evidenceImage} alt="Workplace Evidence" className="w-full h-full object-cover rounded-lg" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                    <span className="text-white text-sm font-bold">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">Upload Workplace Verification Photo</p>
                                                <p className="text-xs text-gray-500">Take a photo of where you worked or a completion certificate</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            )}

                            {/* Call Verification Section */}
                            {verificationMethod === 'call' && (
                                <div className="mt-6 p-6 border border-gray-100 rounded-2xl bg-gray-50 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="text-lg">🤖</span> WorkMate AI Verification Call
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('workerDashboard.contractorPhone')}</label>
                                            <input
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                className="input-field bg-white"
                                                value={contractorPhone}
                                                onChange={e => setContractorPhone(e.target.value)}
                                                disabled={callStatus === 'calling' || callStatus === 'initiating' || callStatus === 'verified'}
                                            />
                                        </div>

                                        {callStatus === 'idle' || callStatus === 'failed' ? (
                                            <button
                                                onClick={handleStartVerificationCall}
                                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>▶️</span> {t('workerDashboard.startCall')}
                                            </button>
                                        ) : (
                                            <div className={`p-4 rounded-xl border ${callStatus === 'verified' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex flex-col items-center gap-2 text-center`}>
                                                {callStatus === 'initiating' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                        <p className="text-sm font-bold">Initiating Call...</p>
                                                    </div>
                                                )}
                                                {callStatus === 'calling' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse">📞</div>
                                                        <p className="text-sm font-bold">Calling Contractor...</p>
                                                        {isMockCall ? (
                                                            <div className="p-2 bg-blue-100 border border-blue-200 rounded text-blue-800 text-[10px] font-bold mt-2">
                                                                ℹ️ MOCK MODE ACTIVE: No real call is placed because Twilio API keys are not configured.
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs opacity-75">WorkMate AI is speaking to your contractor right now. Please wait.</p>
                                                        )}
                                                    </div>
                                                )}
                                                {callStatus === 'verified' && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100">✅</div>
                                                        <p className="text-sm font-bold">Successfully Verified!</p>
                                                        <p className="text-xs opacity-75">Contractor confirmed the employment details via automated call.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {callError && (
                                            <p className="text-xs text-red-600 font-bold text-center mt-2">❌ {callError}</p>
                                        )}
                                    </div>
                                    <p className="mt-4 text-[10px] text-gray-400 text-center">Note: The AI will call and ask for a simple YES (Press 1) or NO (Press 2) from the contractor.</p>
                                </div>
                            )}
                        </div>

                        {manualExp.workplace && manualExp.amount && (
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                {(verificationMethod === 'image' && !evidenceImage) || (verificationMethod === 'call' && callStatus !== 'verified') ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-700 text-xs text-center font-medium">
                                        ⚠️ Verification is compulsory to generate a salary slip.
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-500 mb-4 italic text-center text-green-600 font-medium">✨ {verificationMethod === 'image' ? 'Evidence uploaded!' : 'Employment verified via call!'} You can now generate your salary slip.</p>
                                        <SalarySlip
                                            manualData={{
                                                name: currentUser?.name,
                                                age: currentUser?.age,
                                                workplace: manualExp.workplace,
                                                duration: manualExp.duration,
                                                amount: manualExp.amount,
                                                skill: manualExp.skill,
                                                evidenceUploaded: verificationMethod === 'image',
                                                verifiedViaCall: verificationMethod === 'call',
                                                contractor: manualExp.contractorName || (verificationMethod === 'call' ? contractorPhone : 'Self-Reported'),
                                                workerId: manualExp.workerId,
                                                workerSig,
                                                contractorSig
                                            }}
                                            onDownload={handleGenerateSlip}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {showAdvice && (
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <AIAdvisor pay={manualExp.amount} />
                            </div>
                        )}
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-sm text-red-700">
                            <strong>Note:</strong> These details are for your personal record and salary slip generation. They are not verified by WorkMate AI unless the job was completed through the platform.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'schemes' && !selectedScheme && (
                /* Government Schemes Section */
                <div className="mt-8 mb-8 border-t border-gray-200 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="p-2 bg-orange-100 text-orange-600 rounded-lg">🏛️</span>
                                {t('workerDashboard.schemesTitle')}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{t('schemes.personalized')}</p>
                        </div>
                        <div className="flex-1 w-full md:max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={schemeSearch}
                                onChange={(e) => handleSchemeSearch(e.target.value)}
                                placeholder={t('workerDashboard.searchPlaceholderSchemes') || "Search all 1700+ government schemes..."}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                            />
                            {isSearchingSchemes && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        {/* Income Summary Card */}
                        <div
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl text-white shadow-lg border border-gray-700 min-w-[240px] cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all relative"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('workerDashboard.platformIncome')}</span>
                                <span className="text-[10px] text-orange-400 font-bold underline">{t('workerDashboard.seeBreakdown')}</span>
                            </div>
                            <div className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</div>
                            <p className="text-[10px] text-gray-400 mt-1">{t('workerDashboard.incomeNote')}</p>

                            {showBreakdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 z-50 p-4 max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-bold">{t('workerDashboard.incomeBreakdown')}</h4>
                                        <button onClick={(e) => { e.stopPropagation(); setShowBreakdown(false); }} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>
                                    <div className="space-y-2">
                                        {jobs.filter(j => {
                                            const jWid = j.workerId?._id || j.workerId;
                                            return String(jWid) === String(currentUser?.id) && j.status === 'paid';
                                        }).map((j, i) => (
                                            <div key={i} className="flex justify-between text-xs border-b border-gray-50 pb-2">
                                                <span className="text-gray-600 truncate max-w-[140px]">{j.title}</span>
                                                <span className="font-bold">₹{Number(j.pay).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-red-600">
                                        <span>{t('workerDashboard.total')}</span>
                                        <span>₹{totalIncome.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {schemeSearch.length >= 3 ? (
                            searchResults.map((scheme, idx) => (
                                <div key={idx} onClick={() => handleSchemeClick(scheme.scheme_name, scheme)} className="bg-white p-5 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">
                                                {scheme.scheme_name}
                                            </h3>
                                            <span className="text-[10px] text-orange-600 font-bold px-2 py-1 bg-orange-50 rounded-full border border-orange-100">{scheme.state || 'All India'}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{scheme.description || scheme.short_description || scheme.simple}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                                        <button className="text-xs font-bold text-red-600 hover:underline">{t('schemes.checkDetails')} →</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            Object.keys(schemesData).map((name) => {
                                const translatedScheme = t(`schemes.list.${name}`);
                                const displayScheme = typeof translatedScheme === 'object' ? translatedScheme : schemesData[name];

                                return (
                                    <div key={name} onClick={() => handleSchemeClick(name)} className="bg-white p-5 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">
                                                    {displayScheme.title || name}
                                                </h3>
                                                {totalIncome <= schemesData[name].threshold ?
                                                    <span className="text-[10px] text-gray-700 font-bold px-2 py-1 bg-gray-100 rounded-full border border-gray-200">{t('schemes.matched')}</span> :
                                                    <span className="text-[10px] text-red-500 font-bold px-2 py-1 bg-red-50 rounded-full border border-red-100">{t('schemes.highIncome')}</span>
                                                }
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{displayScheme.simple || schemesData[name].simple}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                            <div className="text-[10px] text-gray-400">
                                                {t('schemes.limit')}: <span className="font-bold text-gray-600">₹{schemesData[name].threshold.toLocaleString()}</span>
                                            </div>
                                            <button className="text-xs font-bold text-orange-600 hover:underline">{t('schemes.checkDetails')} →</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {schemeSearch.length >= 3 && searchResults.length === 0 && !isSearchingSchemes && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No schemes found for "{schemeSearch}"</p>
                            <button onClick={() => setSchemeSearch('')} className="text-red-600 font-bold mt-2 hover:underline">Clear Search</button>
                        </div>
                    )}

                    <div className="mt-12 mb-8 border-t border-gray-200 pt-8">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-between gap-2 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="p-2 bg-red-100 text-red-600 rounded-lg">💰</span>
                                {t('workerDashboard.financialSupportTitle')}
                            </div>
                            <button
                                onClick={() => setShowLoanPredictor(true)}
                                className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all border border-red-200"
                            >
                                📊 {t('workerDashboard.checkLoanEligibility')}
                            </button>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.keys(financeData || {}).map((name) => (
                                <Link
                                    key={name}
                                    to={`/loan/${name}`}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-red-50 hover:border-red-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
                                            {t(`finance.${name}.title`) !== `finance.${name}.title` ? t(`finance.${name}.title`) : name}
                                        </h3>
                                        <span className="text-[10px] font-extrabold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 uppercase tracking-tighter">
                                            {t('workerDashboard.instantApproval')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                        {t(`finance.${name}.purpose`) !== `finance.${name}.purpose` ? t(`finance.${name}.purpose`) : financeData[name].purpose}
                                    </p>
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <span className="text-red-500">✓</span> {t('workerDashboard.interestFree')}
                                        </div>
                                        <span className="text-red-600 group-hover:translate-x-1 transition-transform">{t('common.seeDetails')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>


                </div>
            )}

            {
                activeTab === 'schemes' && selectedScheme && (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                        <div className="bg-gradient-to-r from-red-600 to-gray-800 p-6 text-white flex justify-between items-center">
                            <div>
                                <button onClick={handleBackFromScheme} className="text-white/80 hover:text-white mb-2 flex items-center gap-1 text-sm font-medium">
                                    {t('common.backToList')}
                                </button>
                                <h2 className="text-2xl font-bold">{selectedSchemeData?.scheme_name || selectedScheme}</h2>
                            </div>
                            <button
                                onClick={() => {
                                    const data = selectedSchemeData;
                                    if (!data) return;

                                    const desc = data.description || "";
                                    const benefits = Array.isArray(data.benefits) ? data.benefits.join(", ") : (data.benefits || "");
                                    const docs = Array.isArray(data.documents) ? data.documents.join(", ") : (data.documents || "");

                                    const eligibilityStatus = (!data.threshold || totalIncome <= data.threshold) ? t('workerDashboard.eligible') : t('workerDashboard.notEligible');

                                    const fullText = `${data.scheme_name}. ${desc}. ${eligibilityStatus}. Benefits: ${benefits}. Documents: ${docs}.`;
                                    readAloud(fullText);
                                }}
                                className={`p-4 bg-white/20 rounded-full hover:bg-white/30 transition-all ${isSpeaking ? 'ring-4 ring-white/40 animate-pulse' : ''}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Eligibility Card */}
                            <div className={`p-6 rounded-xl border-2 flex items-center justify-between ${(!selectedSchemeData?.threshold || totalIncome <= selectedSchemeData.threshold) ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                                <div>
                                    <h3 className={`font-bold text-lg ${(!selectedSchemeData?.threshold || totalIncome <= selectedSchemeData.threshold) ? 'text-gray-800' : 'text-red-800'}`}>
                                        {(!selectedSchemeData?.threshold || totalIncome <= selectedSchemeData.threshold) ? `✅ ${t('workerDashboard.eligible')}` : `❌ ${t('workerDashboard.notEligible')}`}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {t('workerDashboard.basedOnIncome')} <strong>₹{totalIncome}</strong>
                                    </p>
                                </div>
                                {selectedSchemeData?.threshold && (
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-400 uppercase">{t('schemes.limit')}</span>
                                        <p className="font-bold text-gray-700">₹{selectedSchemeData.threshold}</p>
                                    </div>
                                )}
                            </div>

                            {/* What is this about? */}
                            <section>
                                <h4 className="font-bold text-gray-900 border-l-4 border-red-500 pl-3 mb-3">{t('workerDashboard.aboutScheme')}</h4>
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {selectedSchemeData?.description || selectedSchemeData?.short_description}
                                </p>
                            </section>

                            <section>
                                <h4 className="font-bold text-gray-900 border-l-4 border-red-500 pl-3 mb-4">{t('workerDashboard.yourBenefits')}</h4>
                                <div className="space-y-3">
                                    {(Array.isArray(selectedSchemeData?.benefits) ? selectedSchemeData.benefits : (selectedSchemeData?.benefits ? [selectedSchemeData.benefits] : [])).map((benefit, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-8 h-8 bg-red-600 text-white flex items-center justify-center rounded-lg shadow-sm text-sm shrink-0">✨</div>
                                            <div className="text-gray-800 font-medium whitespace-pre-line" dangerouslySetInnerHTML={{ __html: benefit }} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Documents Needed */}
                            <section>
                                <h4 className="font-bold text-gray-900 border-l-4 border-red-500 pl-3 mb-4">{t('workerDashboard.requiredDocs')}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(Array.isArray(selectedSchemeData?.documents) ? selectedSchemeData.documents : (selectedSchemeData?.documents ? [selectedSchemeData.documents] : [])).map((doc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="w-6 h-6 bg-red-100 text-red-600 flex items-center justify-center rounded-full text-xs font-bold">{idx + 1}</span>
                                            <span className="text-sm font-medium text-gray-700">
                                                {doc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1">
                                {t('workerDashboard.clickToApply')} {selectedSchemeData?.scheme_name || selectedScheme}
                            </button>
                        </div>
                    </div>
                )}

            {showLoanPredictor && (
                <LoanEligibilityForm
                    translations={translations[currentUser?.lang || 'en']}
                    lang={currentUser?.lang || 'en'}
                    currentUser={currentUser}
                    totalIncome={totalIncome}
                    onClose={() => setShowLoanPredictor(false)}
                />
            )}
        </div>
    );
};

export default WorkerDashboard;
