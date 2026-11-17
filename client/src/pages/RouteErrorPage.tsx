import { Button, Result } from 'antd';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error stopped this page from loading.';

  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle={detail}
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard', { replace: true })}>
          Back to dashboard
        </Button>
      }
    />
  );
}
