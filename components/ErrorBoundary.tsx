import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReload = () => {
        // Reset state to try again
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
                        <AlertCircle size={48} color="#DC2626" />
                    </View>
                    <Text className="text-2xl font-bold text-stone-800 mb-2 text-center">
                        Oops! Something went wrong
                    </Text>
                    <Text className="text-stone-600 text-center mb-8">
                        The app encountered an unexpected error. Please try restarting.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 w-full">
                            <Text className="text-red-800 text-xs font-mono">
                                {this.state.error.toString()}
                            </Text>
                        </View>
                    )}
                    <Pressable
                        onPress={this.handleReload}
                        className="bg-amber-600 rounded-xl py-4 px-8 w-full active:bg-amber-700"
                        style={{ minHeight: 52 }}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Restart App
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => this.setState({ hasError: false, error: null })}
                        className="mt-3 py-3"
                        style={{ minHeight: 44 }}
                    >
                        <Text className="text-amber-600 text-center font-medium">
                            Try Again
                        </Text>
                    </Pressable>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}
