import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HardHat, Briefcase, CheckCircle2 } from 'lucide-react';

import { useApp } from '../context/AppContext';
const LandingPage = () => {
    const { t } = useApp();
    return (
        <div className="relative overflow-hidden bg-white">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-medium mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Connecting Talent with Opportunity
                        </div>

                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                            <span className="block xl:inline">{t('landing.heroTitle')}</span>{' '}
                            <span className="block text-red-600 xl:inline">{t('landing.heroSubtitle')}</span>
                        </h1>

                        <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            {t('landing.heroDesc')}
                        </p>

                        <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                            <Link to="/register-worker" className="btn-primary py-4 px-8 text-lg shadow-red-500/20">
                                <HardHat className="w-5 h-5" />
                                {t('landing.findWork')}
                            </Link>

                            <Link to="/register-contractor" className="btn-secondary py-4 px-8 text-lg border border-gray-200">
                                <Briefcase className="w-5 h-5 text-red-500" />
                                {t('landing.hireWorkers')}
                            </Link>
                        </div>

                    </div>

                    <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                        <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                            <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                                <img
                                    className="w-full h-full object-cover"
                                    src="/hero_worker_contractor.png"
                                    alt="Workers and Contractors" // Placeholder if generated image fails, but expecting it to be there in src via copy
                                // Ideally I should check where generate_image saves. It saves to artifacts. I must copy it to public or src to serve it?
                                // Vite serves public/ root. 
                                // I will need to copy the artifact to the public folder.
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                    <div>
                                        <p className="text-white font-bold text-lg">{t('landing.trustedBy')}</p>
                                        <p className="text-red-200 text-sm">{t('landing.joinNetwork')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="bg-gray-50 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base text-red-600 font-semibold tracking-wide uppercase">{t('landing.featuresTag')}</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">{t('landing.featuresTitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6">
                                <HardHat className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.forWorkersTitle')}</h3>
                            <p className="text-gray-500 leading-relaxed">{t('landing.forWorkersDesc')}</p>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-6">
                                <Briefcase className="w-6 h-6 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.forContractorsTitle')}</h3>
                            <p className="text-gray-500 leading-relaxed">{t('landing.forContractorsDesc')}</p>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.smartManagementTitle')}</h3>
                            <p className="text-gray-500 leading-relaxed">{t('landing.smartManagementDesc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
