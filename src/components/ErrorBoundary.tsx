import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-12">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
                border: '1.5px solid rgba(239,68,68,0.3)',
              }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Something went wrong
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
