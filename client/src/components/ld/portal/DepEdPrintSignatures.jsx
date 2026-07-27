import React from 'react';

/**
 * DepEdPrintSignatures
 * Three-column signature footer for all DepEd official print reports.
 *
 * Structure per column (top → bottom):
 *   ─────────────── (signature rule — always at same height across all 3)
 *   [fixed-height name area — centers name text, absorbs wrapping]
 *   Role label
 *
 * The rule stays perfectly level because:
 *  - It is the first element inside each column flex-container
 *  - The name sits in a fixed min-height box BELOW the rule
 *  - So a 2-line name pushes the label down, not the rule up
 */
const DepEdPrintSignatures = ({
  preparedByName = "JUAN DELA CRUZ",
  reviewedByName = "JAY MONTEALTO, CESO V",
  approvedByName = "SUDI G. ALOLOD, CESO VI",
}) => {
  const cols = [
    {
      name: preparedByName,
      label: "RATEE (EMPLOYEE SIGNATURE)",
      nameClass: "deped-sig-name-black",
      nameStyle: { color: '#111111' },
    },
    {
      name: reviewedByName,
      label: "RATER (SUPERVISOR SIGNATURE)",
      nameClass: "deped-sig-name-navy",
      nameStyle: { color: '#1B2A50' },
    },
    {
      name: approvedByName,
      label: "APPROVING AUTHORITY SIGNATURE",
      nameClass: "deped-sig-name-orange",
      nameStyle: { color: '#C2410C' },
    },
  ];

  return (
    <div
      className="deped-print-signatures hidden print:block"
      style={{ marginTop: '60px', pageBreakInside: 'avoid', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          gap: '40px',
        }}
      >
        {cols.map((col, idx) => (
          <div
            key={idx}
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* ── Signature rule ── always the very first element, so it's always at the same Y position */}
            <div style={{
              borderTop: '1.5px solid #111',
              width: '100%',
              marginBottom: '5px',
            }} />

            {/* ── Name area ── fixed min-height absorbs wrapping without moving the rule */}
            <div style={{
              minHeight: '2.8em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '2px 4px',
            }}>
              <p
                className={col.nameClass}
                style={{
                  fontWeight: 900,
                  fontSize: '11pt',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                  lineHeight: 1.3,
                  ...col.nameStyle,
                }}
              >
                {col.name}
              </p>
            </div>

            {/* ── Role label ── */}
            <p
              className="deped-sig-label"
              style={{
                fontWeight: 600,
                fontSize: '7.5pt',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '3px',
                lineHeight: 1.3,
              }}
            >
              {col.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepEdPrintSignatures;
