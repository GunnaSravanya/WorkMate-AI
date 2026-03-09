import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, ShieldCheck, Printer, Info, CheckCircle2, QrCode, PenLine, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateHash, generateUUID } from '../utils/security';
import qrcode from '../utils/qr-generator';

export const SignatureCanvas = ({ label, onSave, signature, declaration }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(!!signature);

    useEffect(() => {
        if (canvasRef.current && !signature) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
        }
    }, [signature]);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Account for CSS scaling if the canvas is stretched
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const { x, y } = getCoordinates(e);
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const { x, y } = getCoordinates(e);
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            // Auto-save on stroke completion to avoid missing 'Confirm' clicks
            const canvas = canvasRef.current;
            const dataUrl = canvas.toDataURL();
            setHasSigned(true);
            onSave(dataUrl);
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        onSave(null);
    };

    const save = () => {
        // Keep explicit save for reassurance, but auto-save is primary now
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL();
        setHasSigned(true);
        onSave(dataUrl);
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <div className="relative group">
                {signature ? (
                    <div className="border-2 border-gray-100 rounded-xl p-2 bg-gray-50 h-[100px] flex items-center justify-center overflow-hidden">
                        <img src={signature} alt="Signature" className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-1 bg-white hover:border-red-200 transition-colors">
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={100}
                            className="w-full h-[100px] cursor-pencil touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                            style={{ cursor: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDE5bC03IDNsMS03TDYgNmw3IDFsNSA1bC03IDN6Ii8+PHBhdGggZD0iTTE4IDEzbC0zIDMiLz48L3N2Zz4=") 0 16, auto' }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <button onClick={clear} title="Clear" className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-red-50 hover:text-red-600"><RotateCcw size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-[9px] text-gray-400 italic font-medium leading-tight">
                {declaration}
            </p>
        </div>
    );
};

const SalarySlip = ({ job, worker, contractor, manualData }) => {
    const { t } = useApp();
    const [isGenerating, setIsGenerating] = useState(false);
    const [slipData, setSlipData] = useState(null);
    const [workerSig, setWorkerSig] = useState(manualData?.workerSig || null);
    const [contractorSig, setContractorSig] = useState(manualData?.contractorSig || null);
    const [qrDataUrl, setQrDataUrl] = useState('');

    useEffect(() => {
        if (manualData?.workerSig) setWorkerSig(manualData.workerSig);
        if (manualData?.contractorSig) setContractorSig(manualData.contractorSig);
    }, [manualData]);

    const generateSlip = async () => {
        setIsGenerating(true);
        try {
            const date = new Date().toLocaleDateString('en-IN');
            const timestamp = new Date().toLocaleString('en-IN');
            const slipId = generateUUID();

            const data = {
                id: slipId,
                date,
                timestamp,
                workerName: manualData?.name || worker?.name || 'Worker Name',
                workerId: manualData?.workerId || 'N/A',
                role: job?.skill || manualData?.skill || 'General Worker',
                employer: manualData?.contractor || contractor?.name || 'WorkMate AI Corp.',
                location: manualData?.workplace || job?.location || 'On-site',
                basePay: parseFloat(manualData?.amount || job?.pay || 0),
                allowances: parseFloat(job?.calculatedPay ? (job.calculatedPay - (job.pay || 0)) : 0),
                deductions: 0,
            };

            const totalPay = data.basePay + data.allowances - data.deductions;
            const verificationString = `${slipId}|${data.workerName}|${data.employer}|${totalPay}|${timestamp}`;
            const hash = await generateHash(verificationString);

            // Generate QR Code with Version 10 for maximum capacity (274 bytes)
            // This prevents the "code length overflow" hang with long names/data
            const qr = qrcode(10);
            const qrContent = `*** WORKMATE AI PAYROLL ***\nNAME: ${data.workerName}\nID: ${data.workerId}\nCONT: ${data.employer}\nNET PAY: Rs. ${totalPay}\nVERIFY: ${data.id.slice(0, 8)}`;
            qr.addData(qrContent);
            qr.make();
            setQrDataUrl(qr.createImgTag(4, 4));

            setSlipData({ ...data, totalPay, hash });
        } catch (error) {
            console.error('Slip Generation Failed:', error);
            alert('Failed to generate slip. Please check if your input is valid.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!slipData) {
        return (
            <button
                type="button"
                onClick={generateSlip}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold flex items-center justify-center gap-2 shadow-xl transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
            >
                {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                )}
                <span>{isGenerating ? 'Generating Secure Slip...' : 'Generate Corporate Salary Slip'}</span>
            </button>
        );
    }

    return (
        <div id="salary-slip-overlay" className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md overflow-y-auto print:bg-white print:static print:inset-auto print:block animate-in fade-in duration-500 print:animate-none">
            {/* Header - Hidden on print */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-[110] print:hidden shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-green-600 w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Corporate Payroll Engine</h2>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Encryption Level: SHA-256 / AES Ready</p>
                    </div>
                </div>
                {(!workerSig || !contractorSig) && (
                    <div className="flex gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-xs font-black uppercase animate-pulse">
                        Please Sign to Complete Slip
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="p-3 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg transition-all active:scale-90">
                        <Printer className="w-5 h-5" />
                    </button>
                    <button onClick={() => setSlipData(null)} className="p-3 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all active:scale-90">
                        <FileText className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none print:m-0">
                <div id="salary-slip-document" className="bg-white p-12 shadow-2xl relative overflow-hidden print:shadow-none print:p-0 print:border-none">
                    {/* Watermark Section */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none select-none opacity-[0.03] print:opacity-[0.08] whitespace-nowrap z-0">
                        <span className="text-8xl font-black uppercase tracking-[2rem]">Digitally Verified</span>
                    </div>

                    <div className="relative z-10">
                        {/* Logo & ID Section */}
                        <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                            <div>
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="text-white w-10 h-10" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{slipData.employer}</h1>
                                <p className="text-sm text-gray-500 font-medium">Digital Payroll Division • Corporate HQ</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-2 print:text-gray-300">SALARY SLIP</h2>
                                <p className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded inline-block">ID: {slipData.id.split('-')[0].toUpperCase()}</p>
                                <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tighter">Date: {slipData.date}</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Employee Information</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Name:</span> <span className="text-gray-900 font-bold uppercase">{slipData.workerName}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Worker ID:</span> <span className="text-gray-900 font-bold uppercase">{slipData.workerId}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Role:</span> <span className="text-gray-900 font-bold uppercase">{slipData.role}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Verification Status:</span> <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Work Information</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Location:</span> <span className="text-gray-900 font-bold uppercase">{slipData.location}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">System Ref:</span> <span className="text-gray-400 font-mono text-[10px]">{slipData.id.slice(0, 8)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Timestamp:</span> <span className="text-gray-900 font-bold uppercase">{slipData.timestamp}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Earnings Table */}
                        <div className="mb-12">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest print:bg-black print:text-white">
                                        <th className="px-6 py-4 text-left">Description</th>
                                        <th className="px-6 py-4 text-right">Earnings (₹)</th>
                                        <th className="px-6 py-4 text-right">Deductions (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-100">
                                    <tr>
                                        <td className="px-6 py-4 font-bold uppercase">Basic Wage / Salary</td>
                                        <td className="px-6 py-4 text-right">₹{slipData.basePay.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">-</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-bold uppercase">Workmate Performance Bonus</td>
                                        <td className="px-6 py-4 text-right">₹{slipData.allowances.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">-</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <td className="px-6 py-4 font-bold uppercase text-gray-400">Statutory Tax / PF</td>
                                        <td className="px-6 py-4 text-right">-</td>
                                        <td className="px-6 py-4 text-right">₹0.00</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900 text-white print:bg-black print:text-white">
                                        <td className="px-6 py-6 text-xl font-black uppercase tracking-tighter">Net Payable</td>
                                        <td colSpan="2" className="px-6 py-6 text-right text-3xl font-black tracking-tighter">
                                            ₹{slipData.totalPay.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Signatures & Declarations */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            {workerSig ? (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Worker Signature</span>
                                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 h-[100px] flex items-center justify-center overflow-hidden">
                                        <img src={workerSig} alt="Worker Signature" className="max-h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic font-medium leading-tight">Worker declaration: I hereby confirm the receipt of the payment as detailed in this payslip.</p>
                                    <button onClick={() => setWorkerSig(null)} className="text-[8px] text-red-500 font-bold uppercase hover:underline text-left print:hidden">Clear & Re-sign</button>
                                </div>
                            ) : (
                                <SignatureCanvas
                                    label="Worker Signature"
                                    onSave={setWorkerSig}
                                    signature={workerSig}
                                    declaration="Worker declaration: I hereby confirm the receipt of the payment as detailed in this payslip."
                                />
                            )}

                            {contractorSig ? (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contractor Signature</span>
                                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 h-[100px] flex items-center justify-center overflow-hidden">
                                        <img src={contractorSig} alt="Contractor Signature" className="max-h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <p className="text-[9px] text-gray-400 italic font-medium leading-tight">Contractor declaration: I hereby confirm the disbursement of the payment as detailed in this payslip.</p>
                                    <button onClick={() => setContractorSig(null)} className="text-[8px] text-red-500 font-bold uppercase hover:underline text-left print:hidden">Clear & Re-sign</button>
                                </div>
                            ) : (
                                <SignatureCanvas
                                    label="Contractor Signature"
                                    onSave={setContractorSig}
                                    signature={contractorSig}
                                    declaration="Contractor declaration: I hereby confirm the disbursement of the payment as detailed in this payslip."
                                />
                            )}
                        </div>

                        {/* Security Footer Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t-2 border-gray-100">
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                    Security Verification Segment
                                </h3>
                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3 print:bg-white print:border-gray-100">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Verification Hash (SHA-256)</p>
                                        <p className="text-[10px] font-mono text-gray-900 break-all leading-tight">{slipData.hash}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Salary Slip UUID</p>
                                        <p className="text-[10px] font-mono text-gray-900">{slipData.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center space-y-3 bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 print:bg-white print:border-gray-200">
                                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-lg overflow-hidden flex items-center justify-center">
                                    {qrDataUrl ? (
                                        <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                                    ) : (
                                        <QrCode className="w-20 h-20 text-gray-200" />
                                    )}
                                </div>
                                <p className="text-[8px] font-black text-gray-400 text-center uppercase leading-tight">
                                    Scan to Verify<br />Authenticity
                                </p>
                            </div>
                        </div>

                        {/* Legal Footer */}
                        <div className="mt-12 space-y-4 text-center">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                This document is digitally generated and signed via WorkMate AI Corporate Payroll Engine. <br />
                                Any modification invalidates the SHA-256 verification hash and signatures.
                            </p>
                            <div className="flex justify-center gap-8 text-[8px] font-black text-slate-300 uppercase letter-spacing-widest print:text-gray-300">
                                <span>Ref: {slipData.timestamp}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signing Guide - Only shown on screen */}
                {!workerSig || !contractorSig ? (
                    <div className="mt-8 bg-amber-50 border-2 border-amber-100 p-6 rounded-2xl print:hidden animate-in slide-in-from-bottom duration-700">
                        <h3 className="text-amber-900 font-black mb-3 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Signature Required
                        </h3>
                        <p className="text-sm text-amber-800/80 font-medium">
                            Please use your cursor to sign in the respective Worker and Contractor signature boxes above. Click the <strong>Confirm (Pen)</strong> icon in each box to lock your signature onto the slip.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Print CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 1cm; size: a4; }
                    body { visibility: hidden !important; background: white !important; }
                    #salary-slip-overlay, #salary-slip-overlay * { 
                        visibility: visible !important; 
                    }
                    #salary-slip-overlay {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #salary-slip-document {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .print\\:hidden { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}} />
        </div>
    );
};

export default SalarySlip;
