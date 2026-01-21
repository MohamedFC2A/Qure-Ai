import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
            <AuthForm type="signup" />
        </main>
    );
}
