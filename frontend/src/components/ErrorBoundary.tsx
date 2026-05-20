import { Component } from 'react';
import { t } from '../i18n';

interface Props { children: React.ReactNode; fallback?: string; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.props.fallback || t('err_default');
      return <div style={{ padding: 12, color: 'var(--red)' }}>{msg}</div>;
    }
    return this.props.children;
  }
}
