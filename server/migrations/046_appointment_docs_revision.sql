-- Migration 046: Appointment Documents Revision Notes & Status
-- Extends appointment_documents table to support requested revisions and admin review notes.

ALTER TABLE appointment_documents
  MODIFY COLUMN verification_status ENUM('not_uploaded', 'uploaded_pending_review', 'verified', 'needs_revision') NOT NULL DEFAULT 'not_uploaded',
  ADD COLUMN revision_note TEXT DEFAULT NULL AFTER verification_status;
