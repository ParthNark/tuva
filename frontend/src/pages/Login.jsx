import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { GraduationCap, Sparkles } from 'lucide-react'

function Login() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-6"
            >
              <GraduationCap className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Tuva
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              AI learning platform. Teach the AI to learn.
            </p>
          </div>

          <motion.button
            onClick={() => loginWithRedirect()}
            className="w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.2)',
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 32px rgba(6, 182, 212, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <span className="text-cyan-100">Sign in to continue</span>
          </motion.button>

          <p className="text-slate-500 text-xs text-center mt-6">
            Secure authentication via Auth0
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
