import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const QUALIFIED_COLOR = 'text-emerald-700 bg-emerald-50 border-emerald-200';
const DISQ_COLOR = 'text-red-700 bg-red-50 border-red-200';
const SERIF = '"Times New Roman", Georgia, "Palatino Linotype", serif';
const LETTER_BODY = { fontFamily: SERIF, fontSize: '12pt', lineHeight: '1.7', color: '#1a1a1a' };

/* ─── Remarks Chip ────────────────────────────────────────────────── */

export function RemarksChip({ text }) {
    const isDisq = (text || '').startsWith('DISQUALIFIED');
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${isDisq ? DISQ_COLOR : QUALIFIED_COLOR}`}>
            {isDisq ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
            {text}
        </span>
    );
}

/* ─── Letter Header — DepEd Seal + Letterhead ────────────────────── */

export function LetterHeader() {
    return (
        <div className="text-center mb-2">
            <div className="relative w-[96px] h-[96px] mx-auto mb-2">
                <img src="/assets/deped-seal.png" alt="" className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="hidden w-full h-full rounded-full border-2 border-[#1B3A6B] items-center justify-center bg-white">
                    <span className="text-[7px] font-bold text-[#1B3A6B] text-center leading-tight">DEPED<br />SEAL</span>
                </div>
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '12pt', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.4' }}>
                Republic of the Philippines
            </p>
            <p style={{ fontFamily: '"Old English Text MT", "UnifrakturMaguntia", "Times New Roman", serif', fontSize: '17pt', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.3', letterSpacing: '0.5px' }}>
                Department of Education
            </p>
            <p style={{ fontFamily: SERIF, fontVariant: 'small-caps', fontSize: '10pt', color: '#1a1a1a', marginBottom: '1px', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                Region IX, Zamboanga Peninsula
            </p>
            <p style={{ fontFamily: SERIF, fontVariant: 'small-caps', fontSize: '10.5pt', fontWeight: 'bold', color: '#1B3A6B', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                Schools Division of Dapitan City
            </p>
        </div>
    );
}

/* ─── ANNEX E label + Date row ───────────────────────────────────── */

export function AnnexEDateRow({ letterDate }) {
    return (
        <>
            <div className="border-t-2 border-[#1B3A6B] my-4" />
            <div className="flex justify-between items-start" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
                <span>{letterDate}</span>
                <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>ANNEX E</span>
            </div>
        </>
    );
}

/* ─── Recipient Block ────────────────────────────────────────────── */

export function RecipientBlock({ salutation, recipientName, recipientAddress, lastName }) {
    return (
        <div className="my-5" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
            <p className="font-bold mb-1">{salutation} {recipientName}</p>
            <p className="mb-5">{recipientAddress}</p>
            <p>Dear {salutation} {lastName}:</p>
        </div>
    );
}

/* ─── QS Evaluation Table ────────────────────────────────────────── */

export function MqsTable({ tableRows, positionTitle }) {
    return (
        <div className="my-6 overflow-x-auto border border-slate-300" style={{ fontFamily: SERIF }}>
            <table className="w-full text-[11px] border-collapse">
                <thead>
                    <tr className="bg-[#1B3A6B] text-white">
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[16%]">Position Applied for:</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[22%]">CSC Approved QS of the Position</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[30%]">Applicant's Qualifications</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[32%]">Remarks / Details</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((row, i) => {
                        const isDisq = (row.remarks || '').startsWith('DISQUALIFIED');
                        return (
                            <tr key={row.criterion_id || `row-${i}`} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                {i === 0 && (
                                    <td rowSpan={tableRows.length} className="px-3 py-4 border border-slate-200 align-middle text-center font-bold text-[#1B3A6B] text-[12px]" style={{ background: '#f0f4fa' }}>
                                        {positionTitle}
                                    </td>
                                )}
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left">
                                    <span className="text-slate-700">{row.cs_qs}</span>
                                    {row.is_required && (
                                        <span className="block text-[8px] font-bold text-red-500 uppercase mt-0.5">Required</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left text-slate-600">
                                    {row.your_qualifications || 'None'}
                                </td>
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left">
                                    <span className={`font-bold text-[11px] ${isDisq ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {row.remarks}
                                    </span>
                                    {isDisq && row.reason && (
                                        <p className="text-[9px] text-red-500 italic mt-1 leading-snug">{row.reason}</p>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Signatory Block ────────────────────────────────────────────── */

export function SignatoryBlock({ signatory }) {
    return (
        <div className="mt-12 mb-6" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
            <p>Very truly yours,</p>
            <div className="mt-12 mb-3">
                {signatory?.signature_path ? (
                    <img src={signatory.signature_path} alt="Signature" className="h-14 object-contain" />
                ) : (
                    <div className="h-14" />
                )}
            </div>
            <p className="font-bold uppercase">{signatory?.name || 'SCHOOLS DIVISION SUPERINTENDENT'}</p>
            <p style={{ fontSize: '10pt', color: '#475569' }}>{signatory?.position || 'Schools Division Superintendent'}</p>
            {signatory?.designation && (
                <p style={{ fontSize: '10pt', color: '#475569' }}>{signatory.designation}</p>
            )}
        </div>
    );
}

/* ─── Footer Band ────────────────────────────────────────────────── */

export function FooterBand({ office }) {
    const logos = [
        { src: '/assets/deped-seal.png', fallback: 'DepEd' },
        { src: '/assets/bagong-pilipinas.png', fallback: 'Bagong\nPilipinas' },
        { src: '/assets/division-seal.png', fallback: 'Division\nSeal' },
        { src: '/assets/prime-hrm.png', fallback: 'PRIME-\nHRM' }
    ];
    return (
        <div className="mt-14 pt-4 border-t-2 border-[#1B3A6B]" style={{ fontFamily: SERIF }}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                    {logos.map((logo, idx) => (
                        <div key={idx} className="relative w-11 h-11 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                            <img src={logo.src} alt="" className="w-full h-full object-contain p-0.5"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            <div className="hidden w-full h-full items-center justify-center">
                                <span className="text-[5px] font-bold text-center leading-tight text-slate-500 whitespace-pre-line">{logo.fallback}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-1 text-[9px] space-y-0.5 px-3 border-l border-slate-200" style={{ fontFamily: SERIF }}>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Address:</span><span>{office.office_address || office.address}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Telephone No:</span><span>{office.contact}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Website:</span><span>{office.office_website || office.website}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Email Address:</span><span>{office.email}</span></div>
                    {office.facebook && (
                        <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Facebook:</span><span>{office.facebook}</span></div>
                    )}
                </div>
                <div className="text-[8px] border border-[#1B3A6B] shrink-0">
                    <div className="bg-[#1B3A6B] text-white font-bold flex divide-x divide-white text-center">
                        <div className="px-2 py-1 w-20">Doc. Ref. Code</div>
                        <div className="px-1 py-1 w-8">Rev</div>
                        <div className="px-2 py-1 w-16">Effectivity</div>
                        <div className="px-2 py-1 w-12">Page</div>
                    </div>
                    <div className="flex divide-x divide-[#1B3A6B] text-center font-bold text-slate-700">
                        <div className="px-2 py-1 w-20">{office.doc_ref_code || 'SDO-OSDS-F001'}</div>
                        <div className="px-1 py-1 w-8">{office.doc_rev || '00'}</div>
                        <div className="px-2 py-1 w-16">{office.doc_effectivity || '03.18.26'}</div>
                        <div className="px-2 py-1 w-12">1 of 1</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Qualified Letter Variant ───────────────────────────────────── */

export function QualifiedLetter({ data }) {
    const { vacancy, table_rows, signatory, office, letter } = data;
    const recipientName = letter?.recipient_full_name || data.applicant.full_name;
    const recipientAddress = letter?.address || data.applicant.address;
    const letterDate = letter?.letter_date_display || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const evalDate = letter?.eval_date_display || letterDate;
    const salutation = letter?.salutation || 'Mr.';
    const lastName = letter?.last_name || recipientName.trim().split(/\s+/).pop();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-10 py-8 shadow-sm max-w-3xl mx-auto" style={{ ...LETTER_BODY, lineHeight: '1.7' }}>
            <LetterHeader />
            <AnnexEDateRow letterDate={letterDate} />
            <RecipientBlock salutation={salutation} recipientName={recipientName} recipientAddress={recipientAddress} lastName={lastName} />

            <div className="space-y-4 mb-4">
                <p><strong>Congratulations!</strong></p>
                <p className="text-justify">
                    We are pleased to inform you that based on the initial evaluation, we have found your
                    qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved
                    Qualification Standards (QS) of the <strong>{vacancy.position_title}</strong> position
                    under ({vacancy.office_abbreviation}). Below are the results of the initial evaluation
                    conducted by the undersigned dated <strong>{evalDate}</strong>.
                </p>
            </div>

            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            <p className="text-justify mb-4">
                Please be advised of your assigned application code{' '}
                <strong>{data.applicant.ref_no}</strong> which shall be used as you
                proceed with the next stage of the selection process. You may refer to the official issuances
                of DepEd {office.name} for the additional announcements in this regard. For inquiries, you
                may communicate with the office number: <strong>{office.contact}</strong> and email
                address: <strong>{office.email}</strong>. Thank you.
            </p>

            <SignatoryBlock signatory={signatory} />
            <FooterBand office={office} />
        </div>
    );
}

/* ─── Disqualified Letter Variant ────────────────────────────────── */

export function DisqualifiedLetter({ data }) {
    const { vacancy, table_rows, signatory, office, letter } = data;
    const recipientName = letter?.recipient_full_name || data.applicant.full_name;
    const recipientAddress = letter?.address || data.applicant.address;
    const letterDate = letter?.letter_date_display || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const salutation = letter?.salutation || 'Mr.';
    const lastName = letter?.last_name || recipientName.trim().split(/\s+/).pop();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-10 py-8 shadow-sm max-w-3xl mx-auto" style={{ ...LETTER_BODY, lineHeight: '1.7' }}>
            <LetterHeader />
            <AnnexEDateRow letterDate={letterDate} />
            <RecipientBlock salutation={salutation} recipientName={recipientName} recipientAddress={recipientAddress} lastName={lastName} />

            <p className="text-justify mb-4">
                Please be informed of the results of the initial evaluation of your qualifications vis-à-vis
                the Civil Service Commission (CSC) approved Qualification Standards (QS) of
                the <strong>{vacancy.position_title}</strong> position under ({vacancy.office_abbreviation}), as follows:
            </p>

            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            <div className="space-y-4 mb-4">
                <p className="text-justify">
                    While your qualifications made a favorable impression, we regret to inform you that
                    you did not meet the minimum QS set for the <strong>{vacancy.position_title}</strong> position.
                    You may, however, continue to submit job applications in response to other vacancy
                    announcements that we publish at <strong>www.csc.gov.ph/careers</strong>, DepEd {office.name} bulletin
                    boards, and official website.
                </p>
                <p className="text-justify">
                    The results of the initial evaluation shall be released and posted for transparency purposes.
                    You may refer to your assigned application code{' '}
                    <strong>{data.applicant.ref_no}</strong> in the official posting of the results.
                </p>
                <p>Thank you and we wish you the best of luck in your future success.</p>
            </div>

            <SignatoryBlock signatory={signatory} />
            <FooterBand office={office} />
        </div>
    );
}
