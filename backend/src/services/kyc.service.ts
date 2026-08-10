import { query } from '../config/database';
import { KYCVerification } from '../types';
import logger from '../utils/logger';

export class KYCService {
  static async submitKYC(
    userId: string,
    idType: string,
    idNumber: string,
    idDocumentUrl: string,
    idExpiryDate?: Date,
  ): Promise<KYCVerification> {
    try {
      const result = await query(
        `INSERT INTO kyc_verifications (user_id, id_type, id_number, id_document_url, id_expiry_date, verification_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, idType, idNumber, idDocumentUrl, idExpiryDate],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error submitting KYC:', error);
      throw error;
    }
  }

  static async getKYCByUserId(userId: string): Promise<KYCVerification | null> {
    try {
      const result = await query('SELECT * FROM kyc_verifications WHERE user_id = $1', [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting KYC:', error);
      throw error;
    }
  }

  static async approveKYC(kycId: string, verifiedBy: string): Promise<KYCVerification> {
    try {
      const result = await query(
        `UPDATE kyc_verifications
         SET verification_status = 'APPROVED', verified_by = $1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [verifiedBy, kycId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error approving KYC:', error);
      throw error;
    }
  }

  static async rejectKYC(kycId: string, rejectionReason: string, verifiedBy: string): Promise<KYCVerification> {
    try {
      const result = await query(
        `UPDATE kyc_verifications
         SET verification_status = 'REJECTED', rejection_reason = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [rejectionReason, verifiedBy, kycId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error rejecting KYC:', error);
      throw error;
    }
  }

  static async uploadKYCDocument(
    kycId: string,
    documentType: string,
    documentUrl: string,
    mimeType?: string,
  ): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO kyc_documents (kyc_id, document_type, document_url, mime_type, upload_date)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [kycId, documentType, documentUrl, mimeType],
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error uploading KYC document:', error);
      throw error;
    }
  }
}