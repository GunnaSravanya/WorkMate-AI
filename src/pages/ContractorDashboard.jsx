import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, MapPin, DollarSign, Clock, Users, User } from 'lucide-react';

const ContractorDashboard = () => {
    const { jobs, currentUser, t } = useApp();

    // Filter jobs for this contractor (handling both string ID and populated object)
    const myJobs = jobs.filter(job => {
        const jobCid = job.contractorId?._id || job.contractorId;
        const isMatch = String(jobCid) === String(currentUser?.id);
        return isMatch;
    }).slice().reverse();

    console.log('ContractorDashboard State:', {
        currentUserId: currentUser?.id,
        totalJobs: jobs.length,
        myJobsCount: myJobs.length
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Banner */}
            <div className="relative rounded-2xl overflow-hidden mb-8 bg-gray-900 text-white">
                <div className="absolute inset-0 opacity-40">
                    <img src="/hero_worker_contractor.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-white">{t('contractorDashboard.welcome')} {currentUser?.name}</h1>
                    <p className="text-gray-200 mt-2 max-w-xl">{t('contractorDashboard.postNewJob')}</p>
                    <div className="mt-6">
                        <Link to="/post-job" className="btn-primary inline-flex">
                            <Plus className="w-5 h-5" />
                            {t('contractorDashboard.postNewJob')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {myJobs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('contractorDashboard.noJobs')}</h3>
                        <Link to="/post-job" className="btn-primary inline-flex">
                            {t('contractorDashboard.postNewJob')}
                        </Link>
                    </div>
                ) : (
                    myJobs.map(job => (
                        <div key={job.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" /> {job.location}
                                        </span>
                                        <span className="flex items-center gap-1 font-bold text-gray-700">
                                            ₹{job.pay}/{t('workerDashboard.dailyWage').replace('/ ', '')}
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-200">
                                            {job.skill}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'open' ? 'bg-red-50 border-red-200 text-red-700' :
                                        job.status === 'accepted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            job.status === 'completed' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                                'bg-green-50 border-green-200 text-green-700'
                                        }`}>
                                        {job.status.toUpperCase()}
                                    </span>
                                    {/* Vacancies / Worker Info */}
                                    {job.status === 'open' && (
                                        <div className="mt-4 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] uppercase font-bold text-blue-400">Vacancies</div>
                                                <div className="text-xs font-bold text-blue-700">
                                                    {job.vacancies} Spots Left
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {job.workerId && (
                                        <div className="mt-4 flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] uppercase font-bold text-green-400">Mark Attendance For</div>
                                                <div className="text-xs font-bold text-green-700">
                                                    {job.workerId?.name || 'Worker'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Always allow managing/viewing the job */}
                                    <Link to={`/manage-job/${job.id}`} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-bold mt-4">
                                        <Users className="w-4 h-4" /> {job.status === 'open' ? t('contractorDashboard.viewDetails') : t('contractorDashboard.manage')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ContractorDashboard;
