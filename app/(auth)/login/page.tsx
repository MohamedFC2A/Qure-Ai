import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
            <AuthForm type="login" />
        </main>
    );
}
