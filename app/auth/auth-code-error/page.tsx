import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center pt-24 pb-12 px-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                <p className="text-white/60 mb-8">
                    We couldn't verify your login credentials. This can happen if the login link expired or was already used.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="block w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Try Logging In Again
                    </Link>

                    <Link
                        href="/"
                        className="block w-full py-3 px-4 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
