import { query, transaction } from '../config/database';
import { KYCDocument, KYCStatus, KYCDocumentWithUser } from '../types';
import { AppError } from '../middleware/errorHandler';
import { PoolClient } from 'pg';

// Submit KYC document
export const submitKYCDocument = async (
  userId: string,
  data: {
    documentType: string;
    documentNumber?: string;
    documentUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }
): Promise<KYCDocument> => {
  return transaction(async (client: PoolClient) => {
    // Check if document type already exists and is approved
    const existingDoc = await client.query(
      `SELECT * FROM kyc_documents 
       WHERE user_id = $1 AND document_type = $2 AND verification_status = 'approved'`,
      [userId, data.documentType]
    );

    if (existingDoc.rows.length > 0) {
      throw new AppError('This document type has already been verified', 409);
    }

    // Insert new document
    const result = await client.query(
      `INSERT INTO kyc_documents (
        user_id, document_type, document_number, document_url,
        file_name, file_size, mime_type, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        data.documentType,
        data.documentNumber,
        data.documentUrl,
        data.fileName,
        data.fileSize,
        data.mimeType,
        'pending',
      ]
    );

    // Update user KYC status to pending if not already
    await client.query(
      `UPDATE users SET kyc_status = 'pending' 
       WHERE id = $1 AND kyc_status = 'not_started'`,
      [userId]
    );

    const doc = result.rows[0];

    return {
      id: doc.id,
      userId: doc.user_id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      documentUrl: doc.document_url,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      verificationStatus: doc.verification_status,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  });
};

// Get user KYC documents
export const getUserKYCDocuments = async (userId: string): Promise<KYCDocument[]> => {
  const result = await query(
    `SELECT * FROM kyc_documents 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    documentType: row.document_type,
    documentNumber: row.document_number,
    documentUrl: row.document_url,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Get all pending KYC documents (admin)
export const getPendingKYCDocuments = async (): Promise<KYCDocumentWithUser[]> => {
  const result = await query(
    `SELECT kd.*, u.first_name, u.last_name, u.email, u.phone
     FROM kyc_documents kd
     JOIN users u ON kd.user_id = u.id
     WHERE kd.verification_status = 'pending'
     ORDER BY kd.created_at ASC`
  );

  return result.rows;
};

// Verify KYC document (approve)
export const verifyKYCDocument = async (
  documentId: string,
  verifiedBy: string
): Promise<KYCDocument> => {
  return transaction(async (client: PoolClient) => {
    // Update document status
    const docResult = await client.query(
      `UPDATE kyc_documents SET 
        verification_status = 'approved',
        verified_by = $2,
        verified_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND verification_status = 'pending'
       RETURNING *`,
      [documentId, verifiedBy]
    );

    if (docResult.rows.length === 0) {
      throw new AppError('Document not found or already processed', 404);
    }

    const doc = docResult.rows[0];

    // Check if user has all required documents verified
    const requiredDocs = ['national_id', 'proof_of_address'];
    const verifiedDocs = await client.query(
      `SELECT document_type FROM kyc_documents 
       WHERE user_id = $1 AND verification_status = 'approved'`,
      [doc.user_id]
    );

    const verifiedTypes = verifiedDocs.rows.map((row: any) => row.document_type);
    const allDocsVerified = requiredDocs.every((type) => verifiedTypes.includes(type));

    // Update user KYC status if all required documents are verified
    if (allDocsVerified) {
      await client.query(
        `UPDATE users SET kyc_status = 'approved' WHERE id = $1`,
        [doc.user_id]
      );
    }

    return {
      id: doc.id,
      userId: doc.user_id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      documentUrl: doc.document_url,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      verificationStatus: doc.verification_status,
      verifiedBy: doc.verified_by,
      verifiedAt: doc.verified_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  });
};

// Reject KYC document
export const rejectKYCDocument = async (
  documentId: string,
  verifiedBy: string,
  reason: string
): Promise<KYCDocument> => {
  return transaction(async (client: PoolClient) => {
    const result = await client.query(
      `UPDATE kyc_documents SET 
        verification_status = 'rejected',
        verified_by = $2,
        verified_at = CURRENT_TIMESTAMP,
        rejection_reason = $3
       WHERE id = $1 AND verification_status = 'pending'
       RETURNING *`,
      [documentId, verifiedBy, reason]
    );

    if (result.rows.length === 0) {
      throw new AppError('Document not found or already processed', 404);
    }

    const doc = result.rows[0];

    // Update user KYC status to rejected
    await client.query(
      `UPDATE users SET kyc_status = 'rejected' WHERE id = $1`,
      [doc.user_id]
    );

    return {
      id: doc.id,
      userId: doc.user_id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      documentUrl: doc.document_url,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      verificationStatus: doc.verification_status,
      verifiedBy: doc.verified_by,
      verifiedAt: doc.verified_at,
      rejectionReason: doc.rejection_reason,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  });
};

// Get KYC document by ID
export const getKYCDocumentById = async (documentId: string): Promise<KYCDocumentWithUser> => {
  const result = await query(
    `SELECT kd.*, u.first_name, u.last_name, u.email
     FROM kyc_documents kd
     JOIN users u ON kd.user_id = u.id
     WHERE kd.id = $1`,
    [documentId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Document not found', 404);
  }

  return result.rows[0];
};

// Get user KYC status
export const getUserKYCStatus = async (userId: string): Promise<KYCStatus> => {
  const userResult = await query(
    'SELECT kyc_status FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const documents = await getUserKYCDocuments(userId);

  return {
    kycStatus: userResult.rows[0].kyc_status,
    documents,
    requiredDocuments: ['national_id', 'proof_of_address'],
    optionalDocuments: ['passport', 'drivers_license', 'bank_statement', 'payslip'],
  };
};

export default {
  submitKYCDocument,
  getUserKYCDocuments,
  getPendingKYCDocuments,
  verifyKYCDocument,
  rejectKYCDocument,
  getKYCDocumentById,
  getUserKYCStatus,
};
