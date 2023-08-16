import { QueryErrorResetBoundary } from "@tanstack/react-query";
import React from "react";
import { ReactNode, Suspense } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

// MakeFetchingEasy
export const QueryBoundaries = ({ children }: { children: ReactNode }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset} FallbackComponent={ErrorView}>
        <Suspense fallback={<LoadingView />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);

// Spinner
const LoadingView = () => <div>Loading...</div>

// Error + retry
const ErrorView = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <div>{error.message}</div>
      <button title="Retry" onClick={resetErrorBoundary} />
    </div>
  );
};