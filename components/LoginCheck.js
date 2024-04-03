import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';

const LoginCheck = ({ children }) => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until useUser finishes loading
    if (!isLoading) {
      const currentPath = router.pathname;

      if (currentPath !== '/' && !user) {
        router.push('/api/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return !isLoading && <>{children}</>;
};

export default LoginCheck;
