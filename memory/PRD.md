# PRD — LOKUM.PDF (SaaS do dokumentów najmu)

## Oryginalny problem
Użytkownik (17 lat, bez doświadczenia) chce aplikację w stylu 90son.pl, która pomaga w zbyciu/najmie mieszkań i zarabia w modelu subskrypcji (SaaS). Aplikacja używana przez agencje i osoby wynajmujące mieszkania; generuje PDF ze wszystkimi dokumentami. Użytkownik dostarczył istniejący kod Flutter (RentSnap Pro) z modułami: teczka lokali, umowa najmu (zwykła + okazjonalna) z klauzulami, potwierdzenie kaucji, protokół zdawczo-odbiorczy (4 kroki, zdjęcia, podpisy), kalkulator rozliczenia mediów.

## Persony
- Właściciel mieszkań (wynajem prywatny, 1-3 lokale)
- Inwestor premium (portfel lokali)
- Agencja / biuro nieruchomości

## Wyróżnik (słowa użytkownika)
„głównie prostota aplikacji" — komplet dokumentów najmu jako gotowy PDF w kilka minut, bez prawnika.

## Architektura
- FastAPI + MongoDB (backend): auth JWT (cookies httpOnly), CRUD lokali, leady z landing page, 4 generatory PDF (reportlab + czcionki Liberation z polskimi znakami)
- React (frontend): landing page wg wybranego designu „Lokum.pdf Direct Grotesk" (paper-white #f7f5f0, terakota #b5381f, Archivo Black), panel aplikacji z 5 modułami, podpisy cyfrowe (react-signature-canvas), upload zdjęć do protokołu
- Design direction: /app/design/direction.html; wytyczne: /app/design_guidelines.json

## Zaimplementowane (2026-11-06)
- Landing page: hero, marquee, 3 segmenty odbiorców, cennik SaaS (49/199 PLN), formularz wczesnego dostępu (zapis do bazy), stopka
- Autoryzacja: rejestracja/logowanie JWT (bcrypt, cookies, blokada po 5 próbach), trasy chronione
- Panel: Wirtualna Teczka Lokali (CRUD), Umowa najmu PDF (zwykła + okazjonalna, 7 klauzul, podpisy), Potwierdzenie kaucji PDF, Protokół zdawczo-odbiorczy PDF (4 kroki, liczniki, zdjęcia, podpisy), Kalkulator rozliczenia mediów + PDF
- Wszystkie moduły z kodu Flutter przeniesione do wersji webowej
- Testy E2E: rejestracja, dodanie lokalu, generowanie PDF przez UI, polskie znaki w PDF zweryfikowane

## Backlog (priorytet)
- P0: Subskrypcje Stripe (49/199 PLN miesięcznie, webhook, blokada funkcji po wygaśnięciu) — to model zarobkowania użytkownika
- P0: Zapisywanie wygenerowanych dokumentów w historii konta (baza + ponowne pobranie)
- P1: Własne logo na dokumentach (plan Agencja & Pro), wymaga storage plików
- P1: Wypełnianie formularzy danymi z teczki lokali (autouzupełnianie)
- P1: Wersja robocza protokołu zapisywana w bazie (jak SharedPreferences we Flutterze)
- P2: Skanowanie papierowej umowy do PDF (upload zdjęć stron), reset hasła e-mailem (Resend), panel admina (lista leadów i użytkowników), PWA na telefon

## Znane ograniczenia
- Ceny 49/199 PLN to placeholdery z designu — do potwierdzenia przez właściciela
- Brak prawdziwych opinii klientów (uczciwy placeholder na landing page)
- Stripe jeszcze nie podpięty — przyciski cennika prowadzą do rejestracji
