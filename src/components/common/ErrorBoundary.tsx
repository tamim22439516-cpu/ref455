import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">কিছু একটা সমস্যা হয়েছে</h2>
            <p className="text-xs text-slate-600">
              অ্যাপ্লিকেশনটি লোড করতে সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-[#009245] text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              পেজ রিফ্রেশ করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
