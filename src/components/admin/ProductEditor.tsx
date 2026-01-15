'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, Testimonial, FAQ, SocialLink } from '@/types/database'
import ImageUpload from './ImageUpload'

interface ProductEditorProps {
  product: Product
  testimonials: Testimonial[]
  faqs: FAQ[]
  socialLinks: SocialLink[]
}

export default function ProductEditor({
  product,
  testimonials: initialTestimonials,
  faqs: initialFaqs,
  socialLinks: initialSocialLinks,
}: ProductEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description)
  const [priceSar, setPriceSar] = useState(product.price_sar.toString())
  const [beforePriceSar, setBeforePriceSar] = useState(product.before_price_sar?.toString() || '')
  const [deliveryUrl, setDeliveryUrl] = useState(product.delivery_url)
  const [profileImageUrl, setProfileImageUrl] = useState(product.profile_image_url || '')
  const [productImageUrl, setProductImageUrl] = useState(product.product_image_url || '')
  const [brandName, setBrandName] = useState(product.brand_name)
  const [bio, setBio] = useState(product.bio)
  const [customBlocks, setCustomBlocks] = useState(product.custom_blocks || '')
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials)
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price_sar: parseFloat(priceSar),
          before_price_sar: beforePriceSar ? parseFloat(beforePriceSar) : null,
          delivery_url: deliveryUrl,
          profile_image_url: profileImageUrl || null,
          product_image_url: productImageUrl || null,
          brand_name: brandName,
          bio,
          custom_blocks: customBlocks || null,
          testimonials,
          faqs,
          social_links: socialLinks,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Product saved successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save product' })
    } finally {
      setSaving(false)
    }
  }

  const addTestimonial = () => {
    setTestimonials([...testimonials, { id: Date.now().toString(), name: '', text: '' }])
  }

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string) => {
    setTestimonials(testimonials.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const removeTestimonial = (id: string) => {
    setTestimonials(testimonials.filter((t) => t.id !== id))
  }

  const addFaq = () => {
    setFaqs([...faqs, { id: Date.now().toString(), question: '', answer: '' }])
  }

  const updateFaq = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id))
  }

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'tiktok', url: '' }])
  }

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks(socialLinks.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((s) => s.id !== id))
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

      {/* Profile Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-6">
          <ImageUpload
            currentUrl={profileImageUrl}
            type="profile"
            onUpload={setProfileImageUrl}
            label="Profile Image"
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field min-h-[80px]"
                rows={2}
              />
            </div>
          </div>
        </div>
      </section>

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
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[200px] font-mono text-sm"
              rows={8}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">السعر (ر.س)</label>
              <input
                type="number"
                value={priceSar}
                onChange={(e) => setPriceSar(e.target.value)}
                className="input-field"
                step="0.01"
                min="0"
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
              <label className="block text-sm font-medium mb-2">رابط التسليم</label>
              <input
                type="url"
                value={deliveryUrl}
                onChange={(e) => setDeliveryUrl(e.target.value)}
                className="input-field"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <button onClick={addTestimonial} className="btn-secondary text-sm">
            + Add
          </button>
        </div>
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted">Testimonial {index + 1}</span>
                <button
                  onClick={() => removeTestimonial(testimonial.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(testimonial.id, 'name', e.target.value)}
                  className="input-field"
                  placeholder="Name"
                />
                <input
                  type="url"
                  value={testimonial.avatar || ''}
                  onChange={(e) => updateTestimonial(testimonial.id, 'avatar', e.target.value)}
                  className="input-field"
                  placeholder="Avatar URL (optional)"
                />
              </div>
              <textarea
                value={testimonial.text}
                onChange={(e) => updateTestimonial(testimonial.id, 'text', e.target.value)}
                className="input-field mt-3"
                placeholder="Testimonial text"
                rows={2}
              />
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="text-muted text-sm">No testimonials yet.</p>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <button onClick={addFaq} className="btn-secondary text-sm">
            + Add
          </button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted">FAQ {index + 1}</span>
                <button
                  onClick={() => removeFaq(faq.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                className="input-field mb-3"
                placeholder="Question"
              />
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                className="input-field"
                placeholder="Answer"
                rows={2}
              />
            </div>
          ))}
          {faqs.length === 0 && <p className="text-muted text-sm">No FAQ items yet.</p>}
        </div>
      </section>

      {/* Social Links Section */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <button onClick={addSocialLink} className="btn-secondary text-sm">
            + Add
          </button>
        </div>
        <div className="space-y-4">
          {socialLinks.map((link, index) => (
            <div key={link.id} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted">Link {index + 1}</span>
                <button
                  onClick={() => removeSocialLink(link.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={link.platform}
                  onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)}
                  className="input-field"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="snapchat">Snapchat</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}
          {socialLinks.length === 0 && <p className="text-muted text-sm">No social links yet.</p>}
        </div>
      </section>

      {/* Custom Blocks Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Custom Content (Markdown)</h2>
        <textarea
          value={customBlocks}
          onChange={(e) => setCustomBlocks(e.target.value)}
          className="input-field min-h-[150px] font-mono text-sm"
          placeholder="Add any additional content here..."
          rows={6}
        />
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
