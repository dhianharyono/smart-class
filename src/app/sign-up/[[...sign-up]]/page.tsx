import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <SignUp 
        appearance={{
          elements: {
            card: "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl text-white",
            headerTitle: "text-white font-bold text-2xl",
            headerSubtitle: "text-zinc-400",
            formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200",
            socialButtonsBlockButton: "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors duration-200",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg",
            footerActionText: "text-zinc-400",
            footerActionLink: "text-emerald-500 hover:text-emerald-400",
            identityPreviewText: "text-white",
            identityPreviewEditButtonIcon: "text-emerald-500",
            formResendCodeLink: "text-emerald-500 hover:text-emerald-400",
            otpCodeFieldInput: "border-zinc-700 text-white bg-zinc-800 focus:border-emerald-500",
          }
        }} 
      />
    </div>
  );
}
