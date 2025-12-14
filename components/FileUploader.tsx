/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  currentPreview?: string;
  onClear?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  onFileSelect,
  accept = "image/*",
  currentPreview,
  onClear
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (currentPreview) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-black/10 bg-white aspect-square flex items-center justify-center shadow-sm">
        <img src={currentPreview} alt="Preview" className="w-full h-full object-contain" />
        <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <button
            onClick={onClear}
            className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
          >
            <X size={20} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded text-xs text-black font-mono pointer-events-none border border-black/5 shadow-sm">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-square rounded-xl border border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
        ${isDragging 
          ? 'border-black bg-black/5' 
          : 'border-black/10 hover:border-black/30 hover:bg-black/5'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        onChange={handleChange}
      />
      <div className="p-4 text-center pointer-events-none">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
          ${isDragging ? 'bg-black text-white' : 'bg-black/5 text-zinc-400 group-hover:text-black border border-black/5'}`}>
          <Upload size={20} />
        </div>
        <p className="text-sm font-medium text-black mb-1">{label}</p>
        <p className="text-xs text-zinc-500">Drag & drop or click</p>
      </div>
    </div>
  );
};