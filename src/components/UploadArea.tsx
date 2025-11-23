"use client";

import { useRef, useState } from "react";
import { TbCloudUpload } from "react-icons/tb";
import { SOURCE_EXTENSION } from "@/lib/constants";

interface UploadAreaProps {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList) => void;
  onOpenWebDav: () => void;
}

export default function UploadArea({
  onDrop,
  onDragOver,
  onFileSelect,
  onOpenWebDav,
}: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = () => {
    console.log("handleFileSelect called");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange called");
    if (e.target.files && e.target.files.length > 0) {
      console.log("Files selected:", e.target.files.length);
      onFileSelect(e.target.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    console.log("dragEnter");
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    console.log("dragLeave");
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    console.log("UploadArea handleDrop called");
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <div
        className={`relative min-h-[450px] rounded-3xl backdrop-blur-lg border-2 border-dashed shadow-2xl p-8 mt-2 flex flex-col items-center justify-center transition-all duration-300 ease-in-out group cursor-pointer ${
          isDragOver
            ? "bg-white/20 border-blue-400/80"
            : "bg-white/5 border-blue-400/30 hover:border-blue-400/60 hover:bg-white/10"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        {/* Drop Icon - animated bounce on hover */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center mb-4 shadow-xl group-hover:animate-bounce">
          <TbCloudUpload className="w-12 h-12 text-white/90" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isDragOver ? "Drop files here!" : "Drop your files here"}
        </h2>
        <p className="text-lg text-white/70 mb-6 max-w-lg text-center">
          Drag and drop your files here, or click the button below to select
          them from your computer.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFileSelect();
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-2xl text-lg"
          >
            Select Files
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenWebDav();
            }}
            className="text-white/80 text-base underline-offset-4 hover:text-white hover:underline"
          >
            Load from WebDAV
          </button>
          <div className="text-sm text-white/50 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Supports multiple files
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={SOURCE_EXTENSION}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </main>
  );
}
