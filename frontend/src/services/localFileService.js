class LocalFileService {
  constructor() {
    this.isLocal = true;
    this.isAvailable = true;
    this.initializationError = null;
    this.localFiles = new Map(); // Store files in memory
    console.log('Local file service initialized successfully');
  }

  async initializeVault() {
    // No initialization needed for local service
    this.isAvailable = true;
    return Promise.resolve();
  }

  async uploadKycDocument(file, userId) {
    try {
      // Simulate file upload with local storage
      const uploadId = this.generateUploadId();
      const fileName = `kyc-${userId}-${Date.now()}.${this.getFileExtension(file.name)}`;
      
      // Store file info locally (in a real app, you might use IndexedDB)
      const fileInfo = {
        id: uploadId,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        metadata: {
          type: 'kyc-document',
          userId: userId,
          uploadedAt: new Date().toISOString()
        },
        // In a real local storage implementation, you'd store the actual file data
        // For demo purposes, we'll just store file metadata
        uploaded: true
      };
      
      this.localFiles.set(uploadId, fileInfo);
      
      console.log(`KYC document uploaded locally for user ${userId}:`, fileName);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        uploadId,
        fileName,
        url: `local://files/${uploadId}`,
        directUrl: `local://files/${uploadId}`
      };
    } catch (error) {
      console.error('Failed to upload KYC document locally:', error);
      throw error;
    }
  }

  async uploadPropertyDocument(file, propertyId, documentType) {
    try {
      const uploadId = this.generateUploadId();
      const fileName = `${documentType}-${propertyId}-${Date.now()}.${this.getFileExtension(file.name)}`;
      
      const fileInfo = {
        id: uploadId,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        metadata: {
          type: 'property-document',
          propertyId: propertyId,
          documentType: documentType,
          uploadedAt: new Date().toISOString()
        },
        uploaded: true
      };
      
      this.localFiles.set(uploadId, fileInfo);
      
      console.log(`Property document uploaded locally for property ${propertyId}:`, fileName);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        uploadId,
        fileName,
        url: `local://files/${uploadId}`,
        directUrl: `local://files/${uploadId}`
      };
    } catch (error) {
      console.error('Failed to upload property document locally:', error);
      throw error;
    }
  }

  async getFileInfo(uploadId) {
    try {
      const fileInfo = this.localFiles.get(uploadId);
      if (!fileInfo) {
        throw new Error('File not found');
      }
      return fileInfo;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  async downloadFile(uploadId) {
    try {
      const fileInfo = this.localFiles.get(uploadId);
      if (!fileInfo) {
        throw new Error('File not found');
      }
      
      // In a real implementation, you'd return the actual file data
      // For demo purposes, return empty array buffer
      return new ArrayBuffer(0);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  async listFiles(metadataFilter = {}) {
    try {
      const files = Array.from(this.localFiles.values());
      
      if (Object.keys(metadataFilter).length === 0) {
        return files;
      }

      // Filter files by metadata
      return files.filter(file => {
        return Object.entries(metadataFilter).every(([key, value]) => 
          file.metadata && file.metadata[key] === value
        );
      });
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async deleteFile(uploadId) {
    try {
      const deleted = this.localFiles.delete(uploadId);
      if (!deleted) {
        throw new Error('File not found');
      }
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  generateUploadId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Generate hash for blockchain storage
  generateDocumentHash(file) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const data = `${file.name}-${timestamp}-${random}`;
    
    // Simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `0x${Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64)}`;
  }

  // Get vault information (mock)
  async getVaultInfo() {
    return {
      id: 'local-vault',
      name: 'Local File Storage',
      created: new Date().toISOString(),
      fileCount: this.localFiles.size
    };
  }

  // Get vault gallery URL (mock)
  getVaultGalleryUrl() {
    return 'local://vault/gallery';
  }
  
  // Check if service is available
  isServiceAvailable() {
    return this.isAvailable;
  }
  
  // Get initialization error
  getInitializationError() {
    return this.initializationError;
  }
}

// Create singleton instance
const walrusService = new LocalFileService();

export default walrusService;