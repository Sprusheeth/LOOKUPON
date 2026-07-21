import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--accent-red)' }}>
            <AlertTriangle size={64} />
          </div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            We're sorry, an unexpected error occurred. The development team has been notified.
          </p>
          <div style={{
            background: 'var(--bg-card)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            maxWidth: '600px',
            width: '100%',
            overflow: 'auto',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
