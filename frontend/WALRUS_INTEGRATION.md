# Walrus Integration Guide

This project now integrates with Walrus (Tusky) for decentralized file storage and management.

## Setup

### 1. Get Tusky API Key

1. Visit [https://app.tusky.io/](https://app.tusky.io/)
2. Sign up for an account
3. Generate an API key from your dashboard
4. Copy the API key

### 2. Environment Configuration

Create a `.env` file in the `frontend` directory:

```bash
# Walrus/Tusky API Key
VITE_TUSKY_API_KEY=your_tusky_api_key_here
```

### 3. Features Integrated

#### KYC Document Uploads
- **Location**: Property Creator Dashboard → KYC Verification
- **Storage**: Documents are uploaded to Walrus vault
- **Security**: Encrypted storage with metadata
- **Access**: Direct links to view/download documents

#### Property Document Management
- **Location**: Admin Dashboard → Add Property
- **Documents**: Property deeds, appraisals, KYC documents
- **Organization**: Documents are organized by property ID and type
- **Metadata**: Each document includes upload timestamp and property information

#### File Management Features
- **Upload**: Drag & drop or click to upload
- **View**: Direct links to Walrus web interface
- **Download**: Download files directly
- **Delete**: Remove files from storage
- **Metadata**: Rich metadata for organization and search

## Usage

### For KYC Verification
1. Go to KYC Verification page
2. Use the Walrus file upload component
3. Upload your KYC documents (PDF, JPEG, PNG)
4. Documents are automatically stored in Walrus
5. Hash is generated and stored on blockchain

### For Property Creation
1. Go to Admin Dashboard
2. Fill in property details
3. Upload property documents using Walrus components:
   - Property Deed
   - Appraisal Document
   - KYC Document
4. Documents are organized by property ID
5. Hashes are stored on blockchain for verification

## File Organization

### Vault Structure
```
brick-busters-property-tokens/
├── kyc-documents/
│   ├── kyc-user123-timestamp.pdf
│   └── kyc-user456-timestamp.jpg
├── property-documents/
│   ├── deed-property1-timestamp.pdf
│   ├── appraisal-property1-timestamp.pdf
│   └── kyc-property1-timestamp.pdf
└── metadata/
    ├── upload-timestamps
    ├── file-sizes
    └── user-associations
```

### Metadata Fields
- **type**: Document type (kyc-document, property-document)
- **userId**: User wallet address
- **propertyId**: Property identifier
- **documentType**: Specific document type (deed, appraisal, kyc)
- **uploadedAt**: ISO timestamp

## Security Features

### Encryption
- All documents are encrypted in Walrus vault
- API key provides secure access
- Documents are not publicly accessible

### Access Control
- Only authenticated users can upload
- Documents are associated with specific users/properties
- Admin controls for property document access

### Blockchain Integration
- Document hashes stored on blockchain
- Immutable record of document existence
- Verification of document integrity

## API Integration

### WalrusService
```javascript
import walrusService from '../services/walrusService';

// Upload KYC document
const result = await walrusService.uploadKycDocument(file, userId);

// Upload property document
const result = await walrusService.uploadPropertyDocument(file, propertyId, documentType);

// Get file information
const fileInfo = await walrusService.getFileInfo(uploadId);

// Download file
const fileBuffer = await walrusService.downloadFile(uploadId);
```

### React Hook
```javascript
import { useWalrus } from '../hooks/useWalrus';

const { uploadKycDocument, uploadPropertyDocument, uploading } = useWalrus();
```

## Benefits

1. **Decentralized Storage**: Files stored on Walrus network
2. **Encryption**: All documents encrypted
3. **Accessibility**: Direct links to view/download
4. **Organization**: Structured by user and property
5. **Metadata**: Rich metadata for search and organization
6. **Integration**: Seamless blockchain integration
7. **Scalability**: Handles large files and multiple users

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Ensure `VITE_TUSKY_API_KEY` is set in `.env`
   - Restart development server after adding environment variable

2. **Upload Failures**
   - Check file size (max 10MB)
   - Verify file type (PDF, JPEG, PNG only)
   - Ensure network connectivity

3. **Access Issues**
   - Verify API key is valid
   - Check Tusky account status
   - Ensure sufficient storage quota

### Support

- Walrus Documentation: [https://docs.tusky.io/](https://docs.tusky.io/)
- Tusky Web Interface: [https://app.tusky.io/](https://app.tusky.io/)
- API Reference: [https://docs.tusky.io/api/](https://docs.tusky.io/api/)
