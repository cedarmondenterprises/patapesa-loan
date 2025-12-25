import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as kycService from '../services/kyc';
import { ApiResponse } from '../types';

// Submit KYC document
export const submitKYCDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { documentType, documentNumber, documentUrl, fileName, fileSize, mimeType } = req.body;

  if (!documentType || !documentUrl) {
    res.status(400).json({
      success: false,
      message: 'Document type and URL are required',
    } as ApiResponse);
    return;
  }

  const document = await kycService.submitKYCDocument(req.user.userId, {
    documentType,
    documentNumber,
    documentUrl,
    fileName,
    fileSize: fileSize ? parseInt(fileSize) : undefined,
    mimeType,
  });

  res.status(201).json({
    success: true,
    message: 'KYC document submitted successfully',
    data: document,
  } as ApiResponse);
});

// Get user KYC documents
export const getUserKYCDocuments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const documents = await kycService.getUserKYCDocuments(req.user.userId);

  res.status(200).json({
    success: true,
    data: documents,
  } as ApiResponse);
});

// Get user KYC status
export const getUserKYCStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const status = await kycService.getUserKYCStatus(req.user.userId);

  res.status(200).json({
    success: true,
    data: status,
  } as ApiResponse);
});

// Get all pending KYC documents (admin only)
export const getPendingKYCDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await kycService.getPendingKYCDocuments();

  res.status(200).json({
    success: true,
    data: documents,
  } as ApiResponse);
});

// Get KYC document by ID (admin only)
export const getKYCDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await kycService.getKYCDocumentById(id);

  res.status(200).json({
    success: true,
    data: document,
  } as ApiResponse);
});

// Verify KYC document (admin only)
export const verifyKYCDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { id } = req.params;

  const document = await kycService.verifyKYCDocument(id, req.user.userId);

  res.status(200).json({
    success: true,
    message: 'KYC document verified successfully',
    data: document,
  } as ApiResponse);
});

// Reject KYC document (admin only)
export const rejectKYCDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    } as ApiResponse);
    return;
  }

  const document = await kycService.rejectKYCDocument(id, req.user.userId, reason);

  res.status(200).json({
    success: true,
    message: 'KYC document rejected successfully',
    data: document,
  } as ApiResponse);
});

// Upload document file
export const uploadDocument = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Implement file upload to S3 or cloud storage
  // This is a placeholder for the actual file upload logic
  res.status(200).json({
    success: true,
    message: 'File upload endpoint (to be implemented with S3/cloud storage)',
    data: {
      documentUrl: 'https://placeholder-url.com/document.pdf',
    },
  } as ApiResponse);
});

export default {
  submitKYCDocument,
  getUserKYCDocuments,
  getUserKYCStatus,
  getPendingKYCDocuments,
  getKYCDocumentById,
  verifyKYCDocument,
  rejectKYCDocument,
  uploadDocument,
};
