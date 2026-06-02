import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Admin protection
        if (path.startsWith("/admin")) {
            if (token?.role !== "ADMIN") {
                return NextResponse.redirect(new URL("/", req.url));
            }
        }

        // Redirect logged in user from login page to dashboard
        // (Note: middleware config matcher usually excludes /login so this logic might not run if excluded, 
        // but if included, we handle it)
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        // Protect everything except public assets, api/auth, login, and register
        "/((?!api/auth|api/register|login|register|_next/static|_next/image|favicon.ico).*)",
    ],
};
