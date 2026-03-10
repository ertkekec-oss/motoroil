"use client";

import React, { useRef, useState } from "react";
import { useModal } from "@/contexts/ModalContext";

interface ProductImageUploadProps {
    productId?: string | number;
    imageUrl?: string;
    onImageUpload: (data: { imageUrl: string; imageKey?: string }) => void;
}

export default function ProductImageUpload({
    productId,
    imageUrl,
    onImageUpload,
}: ProductImageUploadProps) {
    const { showSuccess, showError } = useModal();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleContainerClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showError("Hata", "Sadece JPEG, PNG veya WEBP formatı desteklenir.");
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            showError("Hata", "Dosya boyutu en fazla 8MB olabilir.");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId ? String(productId) : "temp");

        try {
            const res = await fetch("/api/uploads/products/image", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || "Yükleme başarısız");
            }

            // data.imageUrl and data.key should be returned
            onImageUpload({ imageUrl: data.imageUrl, imageKey: data.key });
            showSuccess("Başarılı", "Görsel başarıyla yüklendi.");
        } catch (error: any) {
            console.error("Image upload error:", error);
            showError("Hata", error.message || "Görsel yüklenirken bir hata oluştu.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset input
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div
                onClick={handleContainerClick}
                className={`
                    relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm 
                    overflow-hidden flex items-center justify-center transition-all duration-200 group
                    relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm 
                    overflow-hidden flex items-center justify-center transition-all duration-200 group bg-slate-50 dark:bg-[#1e293b] cursor-pointer hover:border-slate-300 dark:hover:border-white/20
                    ${isUploading ? "opacity-70 pointer-events-none" : ""}
                `}
            >
                {/* Image Preview or Placeholder */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Uploading State Details */}
                {isUploading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <svg className="animate-spin w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}

                {/* Hover Overlay */}
                {!isUploading && (
                    <div className="absolute inset-0 bg-slate-900/20 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                        <svg className="w-5 h-5 mb-1 text-slate-800 dark:text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-800 dark:text-white drop-shadow-sm">Değiştir</span>
                    </div>
                )}

                {/* Disabled Overlay REMOVED to support pre-upload */}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
            />
        </div>
    );
}
