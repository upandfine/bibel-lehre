/**
 * Auth-Konfiguration (NextAuth.js v4 stable).
 *
 * Wird von:
 *   - app/api/auth/[...nextauth]/route.ts (Handler)
 *   - getServerSession(authOptions) in Server Components
 *   - src/middleware.ts (Routenschutz)
 */

import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Resend } from "resend";

import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import {
  renderMagicLinkHtml,
  renderMagicLinkSubject,
  renderMagicLinkText,
} from "@/lib/email/magic-link";

const validForMinutes = Number(process.env.AUTH_EMAIL_LINK_TTL_MINUTES ?? 30);

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
    error: "/sign-in/error",
  },
  providers: [
    EmailProvider({
      // `server` weglassen — NextAuth v4 setzt einen Default-Stub, der niemals
      // benutzt wird, weil wir `sendVerificationRequest` überschreiben.
      // Wir versenden via Resend statt nodemailer.
      from: process.env.EMAIL_FROM ?? "Bib-Inside <noreply@send.bib-inside.de>",
      maxAge: validForMinutes * 60,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        if (!resendClient) {
          // Im Dev ohne Resend-Key: in Konsole loggen, damit man trotzdem testen kann
          // eslint-disable-next-line no-console
          console.warn(
            `[auth] RESEND_API_KEY nicht gesetzt — Magic-Link für ${email}:\n${url}`,
          );
          return;
        }

        const fromAddress =
          typeof provider.from === "string"
            ? provider.from
            : "Bib-Inside <noreply@send.bib-inside.de>";

        const result = await resendClient.emails.send({
          from: fromAddress,
          to: email,
          subject: renderMagicLinkSubject(),
          text: renderMagicLinkText({ url, email, validForMinutes }),
          html: renderMagicLinkHtml({ url, email, validForMinutes }),
        });

        if (result.error) {
          throw new Error(
            `Magic-Link-Versand an ${email} fehlgeschlagen: ${result.error.message}`,
          );
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Database-Session: `user` ist der DB-User aus dem Adapter.
      // Dank Module Augmentation in src/types/next-auth.d.ts ist `user.role` typisiert.
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "learner";
      }
      return session;
    },
  },
};
