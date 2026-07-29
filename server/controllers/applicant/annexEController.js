const db = require('../../db');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { buildAnnexEPayload, renderAnnexEContent } = require('../rsp/annexEController');

// ─────────────────────────────────────────────
// GET /api/applications/:id/annex-e
// Returns the sent Annex E letter data for the
// authenticated applicant.
// Only returns data if advice_sent_at IS NOT NULL
// (i.e. the admin has clicked "Send").
// ─────────────────────────────────────────────
exports.getAnnexEAdvice = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        // Verify ownership
        const [appRows] = await db.query(
            'SELECT id, advice_sent_at FROM applications WHERE id = ? AND applicant_id = ?',
            [id, applicant_id]
        );
        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const app = appRows[0];

        // Only return if sent (advice_sent_at is set)
        if (!app.advice_sent_at) {
            return res.json(null);
        }

        // Reuse the same payload builder the admin uses
        const data = await buildAnnexEPayload(id);

        // Override advice_sent_at with the actual persisted timestamp
        data.advice_sent_at = app.advice_sent_at;

        res.json(data);
    } catch (error) {
        console.error('getAnnexEAdvice Error:', error);
        if (error.status) return res.status(error.status).json({ message: error.message });
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/applications/:id/annex-e/pdf
// Generates and streams a PDF of the Annex E letter
// for the authenticated applicant.
// ─────────────────────────────────────────────
exports.getAnnexEAdvicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        // Verify ownership and sent status
        const [appRows] = await db.query(
            'SELECT id, advice_sent_at, ref_no FROM applications WHERE id = ? AND applicant_id = ?',
            [id, applicant_id]
        );
        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const app = appRows[0];
        if (!app.advice_sent_at) {
            return res.status(403).json({ message: 'Annex E advice has not yet been sent.' });
        }

        const data = await buildAnnexEPayload(id);
        const { applicant, office } = data;
        const recipientName = data.letter?.recipient_full_name || applicant.full_name;
        const lastName = recipientName.trim().split(/\s+/).pop();

        const doc = new PDFDocument({
            margin: { top: 72, left: 72, right: 72, bottom: 10 }, size: 'LETTER', bufferPages: true,
            info: {
                Title: `Annex E – ${data.variant === 'qualified' ? 'Congratulatory' : 'Disqualification'} – ${applicant.full_name}`,
                Author: office.name, Subject: 'Initial Evaluation Result'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="AnnexE_${(app.ref_no || id).replace(/[^A-Za-z0-9-]/g, '_')}_${lastName.replace(/[^A-Za-z]/g, '')}.pdf"`);

        doc.pipe(res);
        renderAnnexEContent(doc, data);
        doc.end();
    } catch (error) {
        console.error('getAnnexEAdvicePDF Error:', error);
        if (!res.headersSent) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            res.status(500).json({ message: 'Could not generate PDF.' });
        }
    }
};
