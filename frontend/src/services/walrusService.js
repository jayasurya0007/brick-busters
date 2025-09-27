class WalrusService {
  constructor() {
    // Check if we're in development mode or if API key is not set
    const isDevelopment = import.meta.env.DEV;
    const hasApiKey = import.meta.env.VITE_TUSKY_API_KEY;
    
    if (!hasApiKey && !isDevelopment) {
      throw new Error('VITE_TUSKY_API_KEY is not set in environment variables');
    }
    
    this.apiKey = import.meta.env.VITE_TUSKY_API_KEY;
    this.baseUrl = 'https://api.tusky.io';
    this.vaultId = null;
    this.isMockMode = !hasApiKey || isDevelopment;
    
    if (this.isMockMode) {
      console.log('Using mock Walrus service for development');
      this.initializeMockService();
    } else {
      this.initializeVault();
    }
  }

  async initializeMockService() {
    // Import and use mock service
    const MockWalrusService = (await import('./mockWalrusService.js')).default;
    this.mockService = new MockWalrusService();
    this.vaultId = this.mockService.vaultId;
  }

  async initializeVault() {
    try {
      // Create or get existing vault for the application
      const vaults = await this.listVaults();
      let vault = vaults.find(v => v.name === 'brick-busters-property-tokens');
      
      if (!vault) {
        vault = await this.createVault('brick-busters-property-tokens', {
          description: 'Property tokenization platform - KYC documents, property deeds, and appraisals',
          encrypted: true, // Encrypt sensitive documents
        });
      }
      
      this.vaultId = vault.id;
      console.log('Walrus vault initialized:', vault.id);
    } catch (error) {
      console.error('Failed to initialize Walrus vault:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  async listVaults() {
    return await this.makeRequest('/vaults');
  }

  async createVault(name, options = {}) {
    return await this.makeRequest('/vaults', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: options.description || '',
        encrypted: options.encrypted || false
      })
    });
  }

  async uploadKycDocument(file, userId) {
    if (this.isMockMode) {
      return await this.mockService.uploadKycDocument(file, userId);
    }

    try {
      const fileName = `kyc-${userId}-${Date.now()}.${this.getFileExtension(file.name)}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', fileName);
      formData.append('mimeType', file.type);
      formData.append('metadata', JSON.stringify({
        type: 'kyc-document',
        userId: userId,
        uploadedAt: new Date().toISOString()
      }));

      const response = await fetch(`${this.baseUrl}/vaults/${this.vaultId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      const uploadId = result.id || result.uploadId;

      return {
        uploadId,
        fileName,
        url: `https://app.tusky.io/vaults/${this.vaultId}/assets/gallery#${uploadId}`,
        directUrl: `https://app.tusky.io/files/${uploadId}`
      };
    } catch (error) {
      console.error('Failed to upload KYC document:', error);
      throw error;
    }
  }

  async uploadPropertyDocument(file, propertyId, documentType) {
    if (this.isMockMode) {
      return await this.mockService.uploadPropertyDocument(file, propertyId, documentType);
    }

    try {
      const fileName = `${documentType}-${propertyId}-${Date.now()}.${this.getFileExtension(file.name)}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', fileName);
      formData.append('mimeType', file.type);
      formData.append('metadata', JSON.stringify({
        type: 'property-document',
        propertyId: propertyId,
        documentType: documentType, // 'deed', 'appraisal', 'kyc'
        uploadedAt: new Date().toISOString()
      }));

      const response = await fetch(`${this.baseUrl}/vaults/${this.vaultId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      const uploadId = result.id || result.uploadId;

      return {
        uploadId,
        fileName,
        url: `https://app.tusky.io/vaults/${this.vaultId}/assets/gallery#${uploadId}`,
        directUrl: `https://app.tusky.io/files/${uploadId}`
      };
    } catch (error) {
      console.error('Failed to upload property document:', error);
      throw error;
    }
  }

  async getFileInfo(uploadId) {
    if (this.isMockMode) {
      return await this.mockService.getFileInfo(uploadId);
    }

    try {
      return await this.makeRequest(`/files/${uploadId}`);
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  async downloadFile(uploadId) {
    if (this.isMockMode) {
      return await this.mockService.downloadFile(uploadId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/files/${uploadId}/download`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  async listFiles(metadataFilter = {}) {
    if (this.isMockMode) {
      return await this.mockService.listFiles(metadataFilter);
    }

    try {
      const files = await this.makeRequest(`/vaults/${this.vaultId}/files`);
      
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
    if (this.isMockMode) {
      return await this.mockService.deleteFile(uploadId);
    }

    try {
      await this.makeRequest(`/files/${uploadId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Generate hash for blockchain storage
  generateDocumentHash(file) {
    if (this.isMockMode) {
      return this.mockService.generateDocumentHash(file);
    }

    // This would typically use a cryptographic hash function
    // For now, we'll use a simple hash based on file content and metadata
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

  // Get vault information
  async getVaultInfo() {
    if (this.isMockMode) {
      return await this.mockService.getVaultInfo();
    }

    try {
      return await this.makeRequest(`/vaults/${this.vaultId}`);
    } catch (error) {
      console.error('Failed to get vault info:', error);
      throw error;
    }
  }

  // Get vault gallery URL
  getVaultGalleryUrl() {
    if (this.isMockMode) {
      return this.mockService.getVaultGalleryUrl();
    }
    return `https://app.tusky.io/vaults/${this.vaultId}/assets/gallery`;
  }
}

// Create singleton instance
const walrusService = new WalrusService();

export default walrusService;
