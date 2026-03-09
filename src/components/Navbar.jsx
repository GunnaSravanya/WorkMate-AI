import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CheckCircle2, LogOut, User, Briefcase, ChevronDown, Hammer } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { currentUser, logout, language, changeLanguage, t } = useApp();
    const navigate = useNavigate();
    const [showLoginMenu, setShowLoginMenu] = useState(false);
    const [showRegisterMenu, setShowRegisterMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <CheckCircle2 className="w-6 h-6 text-red-500" />
                            WorkMate AI
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Language Switcher */}
                        <div className="flex bg-gray-100 p-1 rounded-xl items-center border border-gray-200">
                            {[
                                { code: 'en', label: 'English', icon: '🇬🇧' },
                                { code: 'hi', label: 'हिंदी', icon: '🇮🇳' },
                                { code: 'te', label: 'తెలుగు', icon: '🇮🇳' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${language === lang.code ? 'bg-white text-red-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className="text-sm">{lang.icon}</span>
                                    <span className="hidden sm:inline">{lang.label}</span>
                                </button>
                            ))}
                        </div>

                        {currentUser ? (
                            <div className="flex gap-4 items-center">
                                <Link
                                    to={currentUser.role === 'worker' ? "/worker-dashboard" : "/contractor-dashboard"}
                                    className="text-sm font-bold text-red-600 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                                {currentUser && (
                                    <div className="relative group">
                                        <button className="flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-red-600 transition-colors py-2">
                                            {t('nav.equipment')} <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <div className="absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 hidden group-hover:block transition-all z-50">
                                            <Link to="/equipment/search" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                                <Hammer size={16} />
                                                {t('nav.findEquipment')}
                                            </Link>
                                            <Link to="/equipment/my" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                                <Briefcase size={16} />
                                                {t('nav.myEquipment')}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm font-bold text-white bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{t('nav.logout')}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 items-center">
                                {/* Login Dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors py-2">
                                        {t('auth.loginBtn')} <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="absolute top-full right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 hidden group-hover:block transition-all z-50">
                                        <Link to="/login-worker" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                            <User className="w-4 h-4" />
                                            {t('auth.workerLogin')}
                                        </Link>
                                        <Link to="/login-contractor" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                            <Briefcase className="w-4 h-4" />
                                            {t('auth.contractorLogin')}
                                        </Link>
                                    </div>
                                </div>

                                {/* Register Dropdown */}
                                <div className="relative group">
                                    <button className="text-sm font-bold px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 flex items-center gap-1">
                                        {t('auth.registerBtn')} <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <div className="absolute top-full right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 hidden group-hover:block transition-all z-50">
                                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Join As</div>
                                        <Link to="/register-worker" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                            <User className="w-4 h-4" />
                                            {t('auth.worker')}
                                        </Link>
                                        <Link to="/register-contractor" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg">
                                            <Briefcase className="w-4 h-4" />
                                            {t('auth.contractor')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
