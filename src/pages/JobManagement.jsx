import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, Users, MapPin, DollarSign, Calendar, CheckCircle2, XCircle, Wallet, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';

const JobManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { jobs, users, markAttendance, completeJob, payJob, t } = useApp();


    const job = jobs.find(j => String(j._id || j.id) === String(id));

    // Find all child jobs (individual worker assignments) that belong to this parent job
    const childJobs = jobs.filter(j => String(j.parentJobId) === String(id));

    // Check if workerId is a populated object or an ID string (legacy fallback)
    const workerName = job?.workerId?.name || (users.find(u => String(u.id) === String(job?.workerId))?.name);

    if (!job) return <div className="text-gray-900 p-8">Job not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BackButton />

            <div className="grid md:grid-cols-3 gap-6">
                {/* Job Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-6">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${job.status === 'paid' ? 'bg-green-50 border-green-200 text-green-700' :
                                job.status === 'completed' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                    'bg-yellow-50 border-yellow-200 text-yellow-700'
                                }`}>
                                {job.status ? job.status.toUpperCase() : 'OPEN'}
                            </span>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500" />
                                {job.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                ₹{job.pay}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                {job.schedule || 'Flexible'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                {job.workersAccepted || childJobs.length} / {job.vacancies + (job.workersAccepted || childJobs.length)} Filled
                            </div>
                        </div>
                    </div>
                </div>

                {/* Worker Management List */}
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {t('jobManagement.workerDetails')}
                    </h2>

                    {childJobs.length === 0 && !job.workerId ? (
                        <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 font-bold">No Workers Yet</h3>
                            <p className="text-gray-500 text-sm">Workers will appear here once they accept the job.</p>
                        </div>
                    ) : (
                        (childJobs.length > 0 ? childJobs : [job]).map((workerJob, idx) => {
                            if (!workerJob) return null; // Safe guard

                            // Safe user lookup
                            const safeUsers = users || [];
                            const wName = workerJob.workerId?.name || (safeUsers.find(u => String(u.id) === String(workerJob.workerId))?.name) || 'Unknown Worker';

                            return (
                                <div key={workerJob.id || idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${workerJob.attendance === 'present' ? 'bg-green-500' :
                                        workerJob.attendance === 'absent' ? 'bg-red-500' :
                                            'bg-gray-200'
                                        }`} />

                                    <div className="flex items-start justify-between mb-6 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                <User className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{wName}</h3>
                                                <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    Worker #{idx + 1}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${workerJob.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            workerJob.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                            {(workerJob.status || 'open').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="pl-4 space-y-6">
                                        {/* Attendance Controls */}
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-2">{t('jobManagement.markAttendance')}</label>
                                            {workerJob.dailyAttendance && workerJob.dailyAttendance.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                                        <span className="text-xs font-bold text-gray-500">Attendance Progress</span>
                                                        <span className="text-xs font-bold text-blue-600">
                                                            {(workerJob.dailyAttendance && workerJob.dailyAttendance.length > 0)
                                                                ? Math.round((workerJob.dailyAttendance.filter(d => d && d.status === 'present').length / workerJob.dailyAttendance.length) * 100)
                                                                : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                        {(workerJob.dailyAttendance || []).map((day, dIdx) => (
                                                            day ? (
                                                                <div key={dIdx} className={`border rounded-lg p-1 text-center ${day.status === 'present' ? 'bg-green-50 border-green-200' :
                                                                    day.status === 'absent' ? 'bg-red-50 border-red-200' :
                                                                        'bg-white border-gray-100'
                                                                    }`}>
                                                                    <div className="text-[10px] text-gray-400 mb-1">D{dIdx + 1}</div>
                                                                    <div className="flex justify-center gap-1">
                                                                        <button
                                                                            disabled={workerJob.status === 'completed' || workerJob.status === 'paid'}
                                                                            onClick={() => markAttendance(workerJob.id, 'present', dIdx)}
                                                                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${day.status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-green-200'}`}
                                                                        >P</button>
                                                                        <button
                                                                            disabled={workerJob.status === 'completed' || workerJob.status === 'paid'}
                                                                            onClick={() => markAttendance(workerJob.id, 'absent', dIdx)}
                                                                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${day.status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-red-200'}`}
                                                                        >A</button>
                                                                    </div>
                                                                </div>
                                                            ) : null
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={workerJob.status === 'completed' || workerJob.status === 'paid'}
                                                        onClick={() => markAttendance(workerJob.id, 'present')}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${workerJob.attendance === 'present'
                                                            ? 'bg-green-600 text-white shadow-sm'
                                                            : 'bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200'
                                                            }`}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        disabled={workerJob.status === 'completed' || workerJob.status === 'paid'}
                                                        onClick={() => markAttendance(workerJob.id, 'absent')}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${workerJob.attendance === 'absent'
                                                            ? 'bg-red-600 text-white shadow-sm'
                                                            : 'bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200'
                                                            }`}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100" />

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                disabled={workerJob.status !== 'accepted' || (!workerJob.attendance && (!workerJob.dailyAttendance || workerJob.dailyAttendance.some(d => d.status === 'pending')))}
                                                onClick={() => completeJob(workerJob.id)}
                                                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${workerJob.status === 'completed' || workerJob.status === 'paid'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 opacity-50'
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                                    }`}
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Complete Job
                                            </button>

                                            <button
                                                disabled={workerJob.status !== 'completed'}
                                                onClick={() => payJob(workerJob.id)}
                                                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${workerJob.status === 'paid'
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                    }`}
                                            >
                                                <Wallet className="w-3 h-3" />
                                                {workerJob.status === 'paid' ? 'Paid' : 'Pay Worker'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobManagement;
