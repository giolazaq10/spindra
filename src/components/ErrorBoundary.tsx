import { Component, type ReactNode } from "react";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="page empty-state" role="alert">
        <h1>Something went wrong.</h1>
        <p>
          Your wallet is not affected. Reload the page to try again.
        </p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload Spindra
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
