import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-700">Something went wrong on this page.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Reload
        </button>
      </div>
    );
  }
}