import React, { useState, useRef } from 'react';
import { Upload, File, X, Download, Eye, Trash2 } from 'lucide-react';
import { useWalrus } from '../hooks/useWalrus';

const WalrusFileUpload = ({ 
  onUploadComplete, 
  documentType = 'document',
  propertyId = null,
  userId = null,
  maxFiles = 1,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  maxSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const { uploadKycDocument, uploadPropertyDocument, deleteFile, downloading } = useWalrus();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Maximum size: ${maxSize / (1024 * 1024)}MB`);
        return;
      }
    }

    // Check max files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Upload files
    for (const file of fileArray) {
      try {
        let result;
        if (documentType === 'kyc') {
          result = await uploadKycDocument(file, userId);
        } else {
          result = await uploadPropertyDocument(file, propertyId, documentType);
        }

        const uploadedFile = {
          id: result.uploadId,
          name: result.fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          directUrl: result.directUrl,
          uploadedAt: new Date().toISOString()
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        
        if (onUploadComplete) {
          onUploadComplete(uploadedFile);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      await deleteFile(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-500">
            {allowedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} files up to {maxSize / (1024 * 1024)}MB
          </p>
          {maxFiles > 1 && (
            <p className="text-xs text-gray-400 mt-1">
              Maximum {maxFiles} files
            </p>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="View in Walrus"
                >
                  <Eye className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => window.open(file.directUrl, '_blank')}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={allowedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default WalrusFileUpload;
