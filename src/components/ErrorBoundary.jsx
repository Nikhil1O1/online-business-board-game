import React from 'react';
import toast from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Game Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Show user-friendly error toast
    toast.error('A game error occurred. Check console for details.', {
      duration: 5000
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="game-container">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-400 mb-4">
                🚨 Game Error
              </h2>
              <p className="text-gray-300 mb-4">
                Something went wrong with the game. This might be due to a connection issue or game state problem.
              </p>
              
              <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-red-300 font-semibold mb-2">Error Details:</h3>
                <pre className="text-red-200 text-sm overflow-auto">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="btn btn-primary"
                >
                  🔄 Try Again
                </button>
                
                <p className="text-gray-400 text-sm">
                  If this keeps happening, try refreshing the page or rejoining the game.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 