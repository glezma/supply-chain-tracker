'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface Props {
    children?: ReactNode;
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
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-red-200 shadow-xl">
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
                            <p className="text-gray-500 text-sm">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>

                            {this.state.error && (
                                <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono text-gray-700 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            )}

                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gray-900 hover:bg-gray-800"
                            >
                                Refresh Page
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
