import React from 'react';

const DepEdPrintHeader = ({ reportTitle, officeTitle = "Office of the Schools Division Superintendent", syPeriod, docControlNo }) => {
  return (
    <div className="deped-print-header hidden print:block text-center mb-6 w-full">
      {/* DepEd Seal */}
      <div className="flex justify-center mb-2">
        <img
          src="/deped-logo.png"
          alt="DepEd Seal"
          className="h-20 w-auto object-contain mx-auto"
        />
      </div>

      {/* Official Header Text */}
      <div className="space-y-0.5 text-black">
        <p className="font-serif italic text-base leading-tight">
          Republic of the Philippines
        </p>
        <p className="font-serif font-bold text-xl leading-tight uppercase tracking-wide">
          Department of Education
        </p>
        <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-gray-800">
          REGION IX, ZAMBOANGA PENINSULA
        </p>
        <p className="font-serif font-black text-sm tracking-widest uppercase text-gray-900">
          SCHOOLS DIVISION OF DAPITAN CITY
        </p>
      </div>

      {/* Double Horizontal Bar Line (Thick upper, thin lower) */}
      <div className="mt-3 mb-3 border-t-2 border-black pt-[2px]">
        <div className="border-t border-black"></div>
      </div>

      {/* Office & Report Subheader */}
      <div className="text-center space-y-1">
        <p className="font-sans font-bold text-xs uppercase tracking-wider text-gray-800">
          {officeTitle}
        </p>
        {reportTitle && (
          <h2 className="font-sans font-black text-lg uppercase tracking-tight text-black mt-2">
            {reportTitle}
          </h2>
        )}
        {syPeriod && (
          <p className="font-sans font-semibold text-xs text-gray-700 uppercase tracking-widest">
            {syPeriod}
          </p>
        )}
      </div>

      {docControlNo && (
        <div className="text-right text-[9px] font-mono text-gray-500 mt-1">
          Doc Control No: {docControlNo}
        </div>
      )}
    </div>
  );
};

export default DepEdPrintHeader;
