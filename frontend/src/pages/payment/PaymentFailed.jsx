import { Link } from 'react-router-dom'
import { XCircle, RefreshCw } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'

export default function PaymentFailed() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card p-10 max-w-sm w-full text-center shadow-glow animate-slide-up">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle size={36} className="text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Payment Failed</h1>
          <p className="text-text-muted text-sm mb-8">
            Something went wrong with your payment. No charges were made. Please try again.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/payment/upgrade" id="payment-retry-btn" className="btn-primary w-full">
              <RefreshCw size={15} /> Try Again
            </Link>
            <Link to="/" className="btn-ghost w-full text-sm">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
