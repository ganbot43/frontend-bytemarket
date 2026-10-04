declare module '#auth-utils' {
  interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: string;
  }

  interface UserSession {
    // Add any additional session properties if needed
  }
}

export {};
