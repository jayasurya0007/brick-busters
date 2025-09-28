import React, { useState, useCallback } from 'react';
import walrusService from '../services/localFileService';
import toast from 'react-hot-toast';

export const useWalrus = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  
  // Check if service is available
  const checkServiceAvailability = useCallback(() => {
    const available = walrusService.isServiceAvailable();
    setIsServiceAvailable(available);
    return available;
  }, []);
  
  // Initialize service availability check
  React.useEffect(() => {
    checkServiceAvailability();
  }, [checkServiceAvailability]);

  const uploadKycDocument = useCallback(async (file, userId) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Check if service is available
      if (!checkServiceAvailability()) {
        throw new Error('File upload service is not available. Please check your configuration.');
      }
      
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large. Maximum 10MB allowed.');
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
      }

      const result = await walrusService.uploadKycDocument(file, userId);
      
      toast.success('KYC document uploaded successfully!');
      return result;
    } catch (error) {
      console.error('KYC upload error:', error);
      toast.error(`Failed to upload KYC document: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [checkServiceAvailability]);

  const uploadPropertyDocument = useCallback(async (file, propertyId, documentType) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Check if service is available
      if (!checkServiceAvailability()) {
        throw new Error('File upload service is not available. Please check your configuration.');
      }
      
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large. Maximum 10MB allowed.');
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
      }

      const result = await walrusService.uploadPropertyDocument(file, propertyId, documentType);
      
      toast.success(`${documentType} document uploaded successfully!`);
      return result;
    } catch (error) {
      console.error('Property document upload error:', error);
      toast.error(`Failed to upload ${documentType} document: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [checkServiceAvailability]);

  const getFileInfo = useCallback(async (uploadId) => {
    try {
      if (!checkServiceAvailability()) {
        throw new Error('File service is not available');
      }
      return await walrusService.getFileInfo(uploadId);
    } catch (error) {
      console.error('Get file info error:', error);
      toast.error('Failed to get file information');
      throw error;
    }
  }, [checkServiceAvailability]);

  const downloadFile = useCallback(async (uploadId, filename) => {
    try {
      if (!checkServiceAvailability()) {
        throw new Error('File service is not available');
      }
      
      const fileBuffer = await walrusService.downloadFile(uploadId);
      
      // Create download link
      const blob = new Blob([fileBuffer]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
      throw error;
    }
  }, [checkServiceAvailability]);

  const listFiles = useCallback(async (metadataFilter = {}) => {
    try {
      if (!checkServiceAvailability()) {
        throw new Error('File service is not available');
      }
      return await walrusService.listFiles(metadataFilter);
    } catch (error) {
      console.error('List files error:', error);
      toast.error('Failed to list files');
      throw error;
    }
  }, [checkServiceAvailability]);

  const deleteFile = useCallback(async (uploadId) => {
    try {
      if (!checkServiceAvailability()) {
        throw new Error('File service is not available');
      }
      await walrusService.deleteFile(uploadId);
      toast.success('File deleted successfully!');
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      toast.error('Failed to delete file');
      throw error;
    }
  }, [checkServiceAvailability]);

  const generateDocumentHash = useCallback((file) => {
    return walrusService.generateDocumentHash(file);
  }, []);

  const getVaultGalleryUrl = useCallback(() => {
    return walrusService.getVaultGalleryUrl();
  }, []);

  return {
    uploading,
    uploadProgress,
    isServiceAvailable,
    uploadKycDocument,
    uploadPropertyDocument,
    getFileInfo,
    downloadFile,
    listFiles,
    deleteFile,
    generateDocumentHash,
    getVaultGalleryUrl,
    checkServiceAvailability
  };
};

export default useWalrus;
