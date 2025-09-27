// Mock Walrus service for development and testing
class MockWalrusService {
  constructor() {
    this.vaultId = 'mock-vault-123';
    this.files = new Map();
    this.nextId = 1;
  }

  async initializeVault() {
    console.log('Mock Walrus vault initialized:', this.vaultId);
    return Promise.resolve();
  }

  async uploadKycDocument(file, userId) {
    return this.uploadFile(file, userId, 'kyc-document');
  }

  async uploadPropertyDocument(file, propertyId, documentType) {
    return this.uploadFile(file, propertyId, 'property-document', documentType);
  }

  async uploadFile(file, identifier, type, documentType = null) {
    const uploadId = `mock-${this.nextId++}`;
    const fileName = documentType 
      ? `${documentType}-${identifier}-${Date.now()}.${this.getFileExtension(file.name)}`
      : `kyc-${identifier}-${Date.now()}.${this.getFileExtension(file.name)}`;

    const fileData = {
      id: uploadId,
      name: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: `https://mock-tusky.io/vaults/${this.vaultId}/assets/gallery#${uploadId}`,
      directUrl: `https://mock-tusky.io/files/${uploadId}`,
      uploadedAt: new Date().toISOString(),
      metadata: {
        type: type,
        userId: identifier,
        propertyId: documentType ? identifier : null,
        documentType: documentType,
        uploadedAt: new Date().toISOString()
      }
    };

    this.files.set(uploadId, fileData);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      uploadId,
      fileName,
      url: fileData.url,
      directUrl: fileData.directUrl
    };
  }

  async getFileInfo(uploadId) {
    const file = this.files.get(uploadId);
    if (!file) {
      throw new Error('File not found');
    }
    return file;
  }

  async downloadFile(uploadId) {
    const file = this.files.get(uploadId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Simulate file download
    await new Promise(resolve => setTimeout(resolve, 500));
    return new ArrayBuffer(1024); // Mock file content
  }

  async listFiles(metadataFilter = {}) {
    const files = Array.from(this.files.values());
    
    if (Object.keys(metadataFilter).length === 0) {
      return files;
    }

    return files.filter(file => {
      return Object.entries(metadataFilter).every(([key, value]) => 
        file.metadata && file.metadata[key] === value
      );
    });
  }

  async deleteFile(uploadId) {
    if (!this.files.has(uploadId)) {
      throw new Error('File not found');
    }
    this.files.delete(uploadId);
    return true;
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  generateDocumentHash(file) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const data = `${file.name}-${timestamp}-${random}`;
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `0x${Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64)}`;
  }

  async getVaultInfo() {
    return {
      id: this.vaultId,
      name: 'brick-busters-property-tokens',
      description: 'Property tokenization platform - KYC documents, property deeds, and appraisals',
      encrypted: true,
      fileCount: this.files.size
    };
  }

  getVaultGalleryUrl() {
    return `https://mock-tusky.io/vaults/${this.vaultId}/assets/gallery`;
  }
}

export default MockWalrusService;
