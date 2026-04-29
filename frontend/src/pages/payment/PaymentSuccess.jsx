import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card p-10 max-w-sm w-full text-center shadow-glow animate-slide-up">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={36} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Payment Successful!</h1>
          <p className="text-text-muted text-sm mb-8">
            Welcome to Premium! Your account has been upgraded. Enjoy featured listings, AI scoring, and more.
          </p>
          <Link to="/dashboard/employer" id="payment-success-dashboard" className="btn-primary w-full">
            Go to Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
