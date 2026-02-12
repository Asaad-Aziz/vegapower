'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, FitnessGoal } from '@/types/database'
import ImageUpload from './ImageUpload'

interface ProductEditorProps {
  product: Product | null
  isNew?: boolean
  onSaved?: () => void
}

const goalOptions: { value: FitnessGoal; label: string }[] = [
  { value: 'fat_loss', label: 'خسارة دهون' },
  { value: 'muscle_gain', label: 'زيادة عضل' },
  { value: 'body_toning', label: 'شد الجسم' },
  { value: 'all', label: 'الكل' },
]

export default function ProductEditor({
  product,
  isNew = false,
  onSaved,
}: ProductEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state - Product specific fields only
  const [title, setTitle] = useState(product?.title || '')
  const [description, setDescription] = useState(product?.description || '')
  const [priceSar, setPriceSar] = useState(product?.price_sar?.toString() || '')
  const [beforePriceSar, setBeforePriceSar] = useState(product?.before_price_sar?.toString() || '')
  const [deliveryUrl, setDeliveryUrl] = useState(product?.delivery_url || '')
  const [productImageUrl, setProductImageUrl] = useState(product?.product_image_url || '')
  const [goal, setGoal] = useState<FitnessGoal>(product?.goal || 'all')
  const [timesBought, setTimesBought] = useState(product?.times_bought?.toString() || '0')
  const [customBlocks, setCustomBlocks] = useState(product?.custom_blocks || '')

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        title,
        description,
        price_sar: parseFloat(priceSar),
        before_price_sar: beforePriceSar ? parseFloat(beforePriceSar) : null,
        delivery_url: deliveryUrl,
        product_image_url: productImageUrl || null,
        goal,
        times_bought: parseInt(timesBought) || 0,
        custom_blocks: customBlocks || null,
      }

      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? '/api/admin/product' : `/api/admin/product?id=${product?.id}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: isNew ? 'Product created successfully!' : 'Product saved successfully!' })
        router.refresh()
        if (onSaved) {
          setTimeout(onSaved, 1000)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save product' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product?.id) return
    
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/product?id=${product.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Product deleted successfully!' })
        if (onSaved) {
          setTimeout(onSaved, 500)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete product' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Product Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Product Details</h2>
        <div className="space-y-6">
          <ImageUpload
            currentUrl={productImageUrl}
            type="product"
            onUpload={setProductImageUrl}
            label="Product Image"
          />
          
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Product title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[200px] font-mono text-sm"
              rows={8}
              placeholder="Product description in markdown..."
            />
          </div>
        </div>
      </section>

      {/* Pricing & Category Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Pricing & Category</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-2">السعر (ر.س)</label>
            <input
              type="number"
              value={priceSar}
              onChange={(e) => setPriceSar(e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
              placeholder="99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">السعر قبل الخصم (اختياري)</label>
            <input
              type="number"
              value={beforePriceSar}
              onChange={(e) => setBeforePriceSar(e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
              placeholder="للعروض فقط"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">هدف اللياقة</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              className="input-field"
            >
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">عدد مرات الشراء</label>
            <input
              type="number"
              value={timesBought}
              onChange={(e) => setTimesBought(e.target.value)}
              className="input-field"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-neutral-500 mt-1">يظهر للزوار كإثبات اجتماعي</p>
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery</h2>
        <div>
          <label className="block text-sm font-medium mb-2">رابط التسليم</label>
          <input
            type="url"
            value={deliveryUrl}
            onChange={(e) => setDeliveryUrl(e.target.value)}
            className="input-field"
            placeholder="https://drive.google.com/..."
          />
          <p className="text-xs text-neutral-500 mt-1">الرابط الذي سيتم إرساله للعميل بعد الشراء</p>
        </div>
      </section>

      {/* Custom Blocks Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Custom Content (Markdown)</h2>
        <textarea
          value={customBlocks}
          onChange={(e) => setCustomBlocks(e.target.value)}
          className="input-field min-h-[150px] font-mono text-sm"
          placeholder="Add any additional content specific to this product..."
          rows={6}
        />
      </section>

      {/* Action Buttons */}
      <div className="flex justify-between">
        {!isNew && product && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        )}
        <div className="flex-1" />
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
