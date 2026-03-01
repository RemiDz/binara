'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  componentDidMount() {
    this._handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', e.reason);
    };
    this._handleError = (e: ErrorEvent) => {
      console.error('Uncaught error:', e.error);
    };
    window.addEventListener('unhandledrejection', this._handleUnhandledRejection);
    window.addEventListener('error', this._handleError);
  }

  componentWillUnmount() {
    if (this._handleUnhandledRejection) {
      window.removeEventListener('unhandledrejection', this._handleUnhandledRejection);
    }
    if (this._handleError) {
      window.removeEventListener('error', this._handleError);
    }
  }

  private _handleUnhandledRejection: ((e: PromiseRejectionEvent) => void) | null = null;
  private _handleError: ((e: ErrorEvent) => void) | null = null;

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-dvh flex items-center justify-center px-6"
          style={{ background: '#050810' }}
        >
          <div className="text-center space-y-6 max-w-sm">
            <h2
              className="font-[family-name:var(--font-playfair)] text-xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h2>
            <p
              className="font-[family-name:var(--font-inter)] text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              The audio engine encountered an issue. This sometimes happens with browser audio permissions.
            </p>
            <button
              onClick={this.handleReload}
              className="font-[family-name:var(--font-inter)] text-sm font-medium px-6 py-3 rounded-full transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(79, 195, 247, 0.12)',
                border: '1px solid rgba(79, 195, 247, 0.25)',
                color: '#4fc3f7',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
