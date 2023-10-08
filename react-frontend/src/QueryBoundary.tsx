import { QueryErrorResetBoundary } from '@tanstack/react-query'
import React from 'react'
import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

// MakeFetchingEasy
export function QueryBoundaries ({ children }: { children: ReactNode }): React.JSX.Element {
  return <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset} FallbackComponent={ErrorView}>
        <Suspense fallback={<LoadingView />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
}

// Spinner
function LoadingView (): React.JSX.Element { return <div>Loading...</div> }

// Error + retry
function ErrorView ({ error, resetErrorBoundary }: FallbackProps): React.JSX.Element {
  return (
    <div>
      <div>{error.message}</div>
      <button title="Retry" onClick={resetErrorBoundary} />
    </div>
  )
}
