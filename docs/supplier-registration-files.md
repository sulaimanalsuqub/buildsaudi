# Supplier registration files

The Arabic and English registration forms replace the catalogue URL with optional multi-file selection. Limits: five files, 3 MiB per file (each upload fits below Vercel's 4.5 MB function request limit). Supported extensions: PDF, JPG/JPEG, PNG, WEBP, DOC/DOCX, XLS/XLSX.

## Verified Odoo mapping

Live schema inspection on 2026-09-20 confirmed that vendors use `res.partner`, and `res.partner.document_ids` references `documents.document`. The actual `action_see_documents` action filters on `partner_id`. The older `/api/vendors/documents` route uses Studio onboarding profiles and is not used by this public registration flow.

Registration returns a short-lived signed upload capability scoped to the resolved vendor and a maximum of five exact file manifests (original name, MIME, byte count, SHA-256). It never exposes Odoo credentials. Each multipart upload goes through `/api/vendors/registration-files`; the browser cannot choose a different vendor ID or file using that capability. Existing registrations resolve to their original partner ID; this feature only appends documents, not edits to existing contact data.

The backend creates `documents.document` with `partner_id`, `res_model=res.partner`, `res_id`, original `name`, binary `raw`, and `description=Build Supplier Registration` plus a SHA-256 marker. Live Odoo uses `raw`, not the old `datas` field. Odoo creates its `ir.attachment` in the same transaction. Link access is disabled; internal Documents users have view access. No new Odoo module or custom field is required.

## Validation and retry

Both client and backend validate extension, MIME, file size and filename. The backend also verifies the file hash and content signature, rejects common active PDF constructs, checks Office container types, and limits Office ZIP expansion while rejecting macro/embedded executable parts. This is format validation, not an antivirus service.

The UI retains completed files after a partial failure and retries only remaining files, using the saved capability without calling registration again. A matching document lookup reconciles timeouts after Odoo commits, preserving the original file name. Concurrent uploads of an identical file from separate requests are not protected by a database unique constraint; sequential browser retries are deduplicated. The pre-existing registration shared-store fallback remains per-instance when Redis is not configured.

## Verification

Unit/integration tests cover optional uploads, MIME/name/size and executable rejection, signed capability tampering/expiry, Odoo linkage, lost create responses and replay. Live verification created test partner 143, document 30 and attachment 369. The supplier document relation and count included the document, and the stored attachment bytes/checksum matched the original upload.

Odoo reference: https://www.odoo.com/documentation/19.0/applications/productivity/documents.html
