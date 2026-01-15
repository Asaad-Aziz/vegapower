'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  currentUrl: string | null
  type: 'profile' | 'product'
  onUpload: (url: string) => void
  label: string
  className?: string
}

export default function ImageUpload({ 
  currentUrl, 
  type, 
  onUpload, 
  label,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, WebP, or GIF')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB')
      return
    }

    setError(null)
    setUploading(true)

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setPreview(data.url)
        onUpload(data.url)
      } else {
        setError(data.error || 'Upload failed')
        setPreview(currentUrl)
      }
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(currentUrl)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(localPreview)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div 
          onClick={handleClick}
          className={`
            relative cursor-pointer border-2 border-dashed border-neutral-200 
            rounded-xl overflow-hidden transition-colors hover:border-neutral-400
            ${type === 'profile' ? 'w-24 h-24 rounded-full' : 'w-40 h-28'}
            ${uploading ? 'opacity-50' : ''}
          `}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Upload</span>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="btn-secondary text-sm py-2 px-4"
          >
            {preview ? 'Change' : 'Upload'}
          </button>
          
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

