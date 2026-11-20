# LOKUM.PDF — konta testowe

## Konto testowe (użytkownik)
- Email: owner@test.pl
- Hasło: test1234
- Rola: user (plan: trial)

## Endpointy autoryzacji
- POST /api/auth/register {name, email, password}
- POST /api/auth/login {email, password}
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh

## Endpointy aplikacji
- POST /api/leads (formularz landing page)
- GET/POST /api/properties, DELETE /api/properties/{id}
- POST /api/documents/lease | deposit | protocol | utilities (zwracają PDF)

Uwaga: konta E2E (e2e_*@test.pl) tworzone automatycznie podczas testów.
