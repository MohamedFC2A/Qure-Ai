import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
    return (
        <main className="min-h-[calc(100vh-4rem)] pt-16 sm:pt-24 pb-16 sm:pb-20 md:pb-12 px-3 sm:px-4 flex items-center justify-center">
            <AuthForm type="login" />
        </main>
    );
}
