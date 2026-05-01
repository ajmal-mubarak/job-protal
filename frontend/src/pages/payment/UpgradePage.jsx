import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Check, Loader } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { paymentsApi } from '../../api/payments'
import { profilesApi } from '../../api/profiles'
import { useAuth } from '../../hooks/useAuth'

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

const FREE_FEATURES = [
  '3 job posts per day',
  'Basic analytics (total views & applicants)',
  '5 AI resume scores per day',
  'Standard listing (no featured)',
]

const PREMIUM_FEATURES = [
  '6 job posts per day',
  '⭐ Featured job listings (priority placement)',
  '20+ AI resume scores per day',
  'Verified Recruiter badge on profile',
  'Advanced analytics (views over time)',
  'Priority reply badge in chat',
  'Instant job visibility',
]

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function UpgradePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [fetchingPremium, setFetchingPremium] = useState(true)

  useEffect(() => {
    profilesApi.getMe()
      .then(res => setIsPremium(res.data?.is_premium || false))
      .catch(() => {})
      .finally(() => setFetchingPremium(false))
  }, [])

  const handleDowngrade = () => {
    toast.info('To cancel your subscription, please contact support at billing@jobportal.com')
  }

  const handleUpgrade = async () => {
    if (!RAZORPAY_KEY) { toast.error('Payment gateway not configured'); return }
    setLoading(true)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Failed to load payment gateway'); return }

      // Create order
      const orderRes = await paymentsApi.subscribe()
      const { order_id, amount, currency } = orderRes.data

      const options = {
        key: RAZORPAY_KEY,
        amount,
        currency,
        name: 'JobPortal Premium',
        description: 'Premium Subscription',
        order_id,
        prefill: { name: user?.name, email: '' },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            navigate('/payment/success')
          } catch {
            navigate('/payment/failed')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 badge badge-warning mb-4 text-sm px-3 py-1.5">
              <Zap size={14} fill="currentColor" /> Premium Plan
            </div>
            <h1 className="text-4xl font-black text-text-primary mb-3">Supercharge Your Hiring</h1>
            <p className="text-text-muted text-lg max-w-xl mx-auto">Get featured listings, unlimited AI scoring, and recruiter verification to stand out from the crowd.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="card p-8">
              <div className="mb-6">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Free</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-text-primary">₹0</span>
                  <span className="text-text-muted mb-1">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={15} className="text-success mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button 
                className="btn-secondary w-full" 
                disabled={!isPremium}
                onClick={isPremium ? handleDowngrade : undefined}
              >
                {isPremium ? 'Cancel Subscription' : 'Current Plan'}
              </button>
            </div>

            {/* Premium */}
            <div className="card p-8 border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-accent/5 shadow-glow relative overflow-hidden">
              <div className="absolute top-4 right-4 badge badge-warning">Most Popular</div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">Premium</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-text-primary">₹999</span>
                  <span className="text-text-muted mb-1">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Zap size={15} className="text-warning mt-0.5 flex-shrink-0" fill="currentColor" /> {f}
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <button className="btn-secondary w-full py-3" disabled>
                  Current Plan (Active)
                </button>
              ) : (
                <button id="upgrade-btn" onClick={handleUpgrade} disabled={loading || fetchingPremium} className="btn-primary w-full py-3">
                  {loading ? <Loader size={16} className="animate-spin" /> : <><Zap size={16} /> Upgrade Now</>}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-text-muted mt-6">
            Secure payment via Razorpay · Cancel anytime · No hidden fees
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
