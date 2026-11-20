"""Polish rental document generators (ported from the Flutter RentSnap Pro modules)."""
import base64
import io
from reportlab.lib.utils import ImageReader
from datetime import datetime, timezone
from pdf_utils import PDFDoc


def _v(data, key, default="-"):
    val = data.get(key)
    if val is None or str(val).strip() == "":
        return default
    return str(val).strip()


def _num(value):
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def _draw_signatures(doc, data, left_label="Podpis Wynajmującego", right_label="Podpis Najemcy", single=False):
    """Uniwersalna funkcja rysująca profesjonalne linie i odręczne podpisy na samym dole strony."""
    canvas_obj = getattr(doc, "canvas", getattr(doc, "c", None))
    if not canvas_obj:
        return
    
    line_y = 70
    img_y = line_y + 8
    
    canvas_obj.saveState()
    canvas_obj.setStrokeColorRGB(0.2, 0.2, 0.2)
    canvas_obj.setLineWidth(0.5)
    
    if single:
        # Pojedynczy podpis (np. potwierdzenie kaucji - po prawej stronie)
        canvas_obj.line(315, line_y, 505, line_y)
        canvas_obj.drawString(315, line_y - 12, right_label)
        
        sig = data.get("signature") or data.get("tenant_signature")
        if sig and sig.startswith("data:image"):
            try:
                header, encoded = sig.split(",", 1)
                img_data = base64.b64decode(encoded)
                sig_image = ImageReader(io.BytesIO(img_data))
                canvas_obj.drawImage(sig_image, 335, img_y, width=130, height=45, mask='auto')
            except Exception as e:
                print("Błąd podpisu:", e)
    else:
        # Dwa podpisy (Wynajmujący / Najemca lub Przekazujący / Przejmujący)
        canvas_obj.line(50, line_y, 240, line_y)
        canvas_obj.drawString(50, line_y - 12, left_label)

        canvas_obj.line(315, line_y, 505, line_y)
        canvas_obj.drawString(315, line_y - 12, right_label)

        # Lewy podpis
        left_sig = data.get("landlord_signature")
        if left_sig and left_sig.startswith("data:image"):
            try:
                header, encoded = left_sig.split(",", 1)
                img_data = base64.b64decode(encoded)
                sig_image = ImageReader(io.BytesIO(img_data))
                canvas_obj.drawImage(sig_image, 70, img_y, width=130, height=45, mask='auto')
            except Exception as e:
                print("Błąd lewego podpisu:", e)

        # Prawy podpis
        right_sig = data.get("tenant_signature")
        if right_sig and right_sig.startswith("data:image"):
            try:
                header, encoded = right_sig.split(",", 1)
                img_data = base64.b64decode(encoded)
                sig_image = ImageReader(io.BytesIO(img_data))
                canvas_obj.drawImage(sig_image, 335, img_y, width=130, height=45, mask='auto')
            except Exception as e:
                print("Błąd prawego podpisu:", e)
                
    canvas_obj.restoreState()


def generate_lease_pdf(data: dict) -> bytes:
    print("Otrzymane dane w PDF:", data.get("custom_texts"))
    occasional = bool(data.get("occasional"))
    title = "UMOWA NAJMU OKAZJONALNEGO LOKALU MIESZKALNEGO" if occasional else "UMOWA NAJMU LOKALU MIESZKALNEGO"
    doc = PDFDoc(title)
    doc.heading("UMOWA NAJMU OKAZJONALNEGO" if occasional else "UMOWA NAJMU")
    doc.paragraph(
        f"Zawarta w dniu {_v(data, 'date')} r. w miejscowości {_v(data, 'city')}, pomiędzy:"
    )
    doc.paragraph(f"1. Wynajmującym: {_v(data, 'landlord_name')} ({_v(data, 'landlord_id')}), zwanym dalej \u201eWynajmującym\u201d,")
    doc.paragraph("a")
    doc.paragraph(f"2. Najemcą: {_v(data, 'tenant_name')} ({_v(data, 'tenant_id')}), zwanym dalej \u201eNajemcą\u201d.")
    doc.spacer(2)

    doc.section("§ 1. PRZEDMIOT NAJMU")
    doc.paragraph(
        f"1. Wynajmujący oświadcza, że jest właścicielem lokalu mieszkalnego położonego pod adresem: "
        f"{_v(data, 'address')}, o powierzchni {_v(data, 'area')} m\u00b2.\n"
        "2. Wynajmujący oddaje Najemcy w/w lokal do używania na cele mieszkalne."
    )

    doc.section("§ 2. CZAS TRWANIA UMOWY")
    doc.paragraph(
        f"Umowa zostaje zawarta na czas określony: od dnia {_v(data, 'start_date')} do dnia {_v(data, 'end_date')}."
    )

    doc.section("§ 3. CZYNSZ I OPŁATY")
    doc.paragraph(
        f"1. Miesięczny czynsz najmu wynosi {_v(data, 'rent_amount')} PLN.\n"
        f"2. Czynsz płatny jest z góry do dnia {_v(data, 'payment_day')} każdego miesiąca "
        "na wskazany rachunek bankowy Wynajmującego."
    )

    doc.section("§ 4. KAUCJA ZABEZPIECZAJĄCA")
    doc.paragraph(
        f"1. Tytułem zabezpieczenia ewentualnych roszczeń, Najemca wpłaca kaucję w wysokości "
        f"{_v(data, 'deposit_amount')} PLN.\n"
        "2. Kaucja podlega zwrotu w ciągu 30 dni od dnia opróżnienia lokalu, po potrąceniu ewentualnych należności."
    )

    rules_no = 5
    if occasional:
        doc.section("§ 5. NAJEM OKAZJONALNY I OŚWIADCZENIE O EGZEKUCJI")
        doc.paragraph(
            "1. Niniejsza umowa jest umową najmu okazjonalnego lokalu w rozumieniu Ustawy o ochronie praw lokatorów.\n"
            "2. Najemca dołączył do niniejszej umowy oświadczenie w formie aktu notarialnego, w którym poddał się "
            "egzekucji i zobowiązał się do opróżnienia i wydania lokalu w terminie.\n"
            f"3. Jako lokal zastępczy na wypadek egzekucji Najemca wskazał adres: {_v(data, 'alt_address')}, "
            f"którego właścicielem jest {_v(data, 'alt_owner')}."
        )
        rules_no = 6

    doc.section(f"§ {rules_no}. ZASADY UŻYTKOWANIA LOKALU I OGRANICZENIA")
    i = 1
    clauses = data.get("clauses", {}) or {}
    
    if clauses.get("no_smoking", True):
        doc.paragraph(
            f"{i}. W lokalu obowiązuje bezwzględny zakaz palenia wyrobów tytoniowych, e-papierosów oraz podgrzewaczy "
            f"tytoniu. Naruszenie zakazu wiąże się z obowiązkiem pokrycia kosztów ozonowania/malowania lokalu oraz "
            f"zapłatą kary umownej w wysokości {_v(data, 'smoking_penalty', '1000')} PLN."
        )
        i += 1
    if clauses.get("no_sublet", True):
        doc.paragraph(f"{i}. Najemca nie ma prawa podnajmować lokalu ani oddawać go w bezpłatne używanie osobom trzecim bez uprzedniej, pisemnej zgody Wynajmującego.")
        i += 1
    if clauses.get("no_business", True):
        doc.paragraph(f"{i}. Lokal przeznaczony jest wyłącznie na cele mieszkalne. Prowadzenie w nim jakiejkolwiek działalności gospodarczej bez zgody Wynajmującego jest zabronione.")
        i += 1
    if clauses.get("no_pets", False):
        doc.paragraph(f"{i}. Przetrzymywanie zwierząt w lokalu wymaga pisemnej zgody Wynajmującego.")
        i += 1
    if clauses.get("quiet_hours", True):
        doc.paragraph(f"{i}. Najemca zobowiązuje się do przestrzegania regulaminu budynku oraz zasad współżycia społecznego, w tym ciszy nocnej w godzinach 22:00\u20136:00.")
        i += 1
    if clauses.get("report_defects", True):
        doc.paragraph(f"{i}. Najemca zobowiązany jest do niezwłocznego zgłaszania Wynajmującemu wszelkich usterek i awarii w lokalu, pod rygorem odpowiedzialności za wynikłe z opóźnienia szkody.")
        i += 1
    if clauses.get("inspection_access", True):
        doc.paragraph(f"{i}. Wynajmujący zastrzega sobie prawo do wglądu w stan lokalu oraz dokonania niezbędnych przeglądów technicznych, po wcześniejszym uzgodnieniu terminu z Najemcą.")
        i += 1

    # Automatyczne dodawanie własnych klauzul i pomijanie usuniętych
    custom_texts = data.get("custom_texts", {}) or {}
    for clause_key, is_active in clauses.items():
        if clause_key.startswith("custom_") and is_active:
            clause_content = custom_texts.get(clause_key)
            if clause_content:
                doc.paragraph(f"{i}. {clause_content}")
                i += 1

    doc.section(f"§ {rules_no + 1}. POSTANOWIENIA KOŃCOWE")
    doc.paragraph(
        "1. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego oraz "
        "Ustawy o ochronie praw lokatorów.\n"
        "2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron."
    )
    doc.spacer(4)
    
    _draw_signatures(doc, data, "Podpis Wynajmującego", "Podpis Najemcy")
    return doc.save()


def generate_deposit_pdf(data: dict) -> bytes:
    doc = PDFDoc("POTWIERDZENIE WPŁATY KAUCJI")
    doc.heading("POTWIERDZENIE WPŁATY KAUCJI")
    doc.paragraph(f"Miejscowość: {_v(data, 'city')}  |  Data: {_v(data, 'date')}")
    doc.spacer(3)
    doc.paragraph(
        f"Wynajmujący: {_v(data, 'landlord_name')} potwierdza otrzymanie kaucji zabezpieczającej od Najemcy: "
        f"{_v(data, 'tenant_name')}."
    )
    doc.paragraph(f"Kwota kaucji: {_v(data, 'amount')} PLN", bold=True)
    doc.paragraph(f"Sposób zapłaty: {_v(data, 'method', 'Przelew bankowy')}")
    doc.paragraph(f"Dotyczy lokalu pod adresem: {_v(data, 'address')}")
    doc.spacer(10)
    
    _draw_signatures(doc, data, right_label="Podpis przyjmującego kaucję", single=True)
    return doc.save()


def generate_protocol_pdf(data: dict) -> bytes:
    doc = PDFDoc("PROTOKÓŁ ZDAWCZO-ODBIORCZY LOKALU")
    doc.heading("PROTOKÓŁ ZDAWCZO-ODBIORCZY LOKALU")
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    doc.section("1. DANE FORMALNE I NIERUCHOMOŚĆ")
    doc.paragraph(f"Miejscowość: {_v(data, 'city')}  |  Data: {_v(data, 'date')}")
    doc.paragraph(f"Podstawa przekazania: {_v(data, 'contract_ref')}")
    doc.paragraph(f"Adres lokalu: {_v(data, 'address')}")
    doc.paragraph(f"Metraż: {_v(data, 'area')} m\u00b2  |  Liczba pokoi: {_v(data, 'rooms')}")
    doc.paragraph(f"Przekazujący: {_v(data, 'landlord_name')} ({_v(data, 'landlord_id')})")
    doc.paragraph(f"Przejmujący: {_v(data, 'tenant_name')} ({_v(data, 'tenant_id')})")

    doc.section("2. STANY LICZNIKÓW MEDIÓW")
    doc.bullet(f"Energia el.: Stan {_v(data, 'elec_val')} kWh (Nr licznika: {_v(data, 'elec_num')})")
    doc.bullet(f"Woda zimna: Stan {_v(data, 'water_cold_val')} m\u00b3 (Nr licznika: {_v(data, 'water_cold_num')})")
    doc.bullet(f"Woda ciepła: Stan {_v(data, 'water_hot_val')} m\u00b3 (Nr licznika: {_v(data, 'water_hot_num')})")
    doc.bullet(f"Gaz: Stan {_v(data, 'gas_val')} m\u00b3 (Nr licznika: {_v(data, 'gas_num')})")
    doc.bullet(f"Ogrzewanie: Stan {_v(data, 'heating_val')}")

    doc.section("3. STAN TECHNICZNY LOKALU")
    doc.paragraph(f"Ściany i sufity: {_v(data, 'walls')}")
    doc.paragraph(f"Podłogi: {_v(data, 'floors')}")
    doc.paragraph(f"Okna i drzwi: {_v(data, 'doors_windows')}")
    doc.paragraph(f"Instalacje: {_v(data, 'installations')}")
    defects = _v(data, "defects", "")
    doc.paragraph(f"Wykaz usterek: {defects if defects.strip() not in ('', '-') else 'Brak'}")

    doc.section("4. WYPOSAŻENIE I KLUCZE")
    doc.paragraph(f"Meble / Wyposażenie: {_v(data, 'furniture')}")
    doc.paragraph(f"Sprzęt AGD/RTV: {_v(data, 'appliances')}")
    doc.paragraph(f"Liczba kompletów kluczy: {_v(data, 'keys_count')}")
    doc.paragraph(f"Liczba pilotów: {_v(data, 'remotes_count')}")
    doc.paragraph(f"Kody dostępu: {_v(data, 'access_codes')}")

    doc.photo_grid(data.get("photos") or [])

    doc.spacer(2)
    doc.paragraph(
        f"Oświadczenie: Strony potwierdzają, że stan lokalu oraz odczyty liczników zgadzają się ze stanem "
        f"faktycznym. Protokół sporządzono cyfrowo w aplikacji LOKUM.PDF w dniu {stamp}.",
        size=8,
    )
    
    _draw_signatures(doc, data, "Podpis przekazującego", "Podpis przejmującego")
    return doc.save()


def generate_utilities_pdf(data: dict) -> bytes:
    doc = PDFDoc("ROZLICZENIE MEDIÓW")
    doc.heading("ROZLICZENIE MEDIÓW")
    doc.paragraph(f"Miejscowość: {_v(data, 'city')}  |  Data: {_v(data, 'date')}")
    doc.paragraph(f"Lokal: {_v(data, 'address')}  |  Najemca: {_v(data, 'tenant_name')}")
    doc.spacer(2)

    doc.section("1. STAN LICZNIKÓW I ZUŻYCIE MEDIÓW")
    
    total = 0.0
    rows = [
        ("Energia elektryczna", "elec_start", "elec_end", "elec_rate", "kWh"),
        ("Woda", "water_start", "water_end", "water_rate", "m\u00b3"),
        ("Gaz", "gas_start", "gas_end", "gas_rate", "m\u00b3"),
    ]
    
    for label, k_start, k_end, k_rate, unit in rows:
        start, end, rate = _num(data.get(k_start)), _num(data.get(k_end)), _num(data.get(k_rate))
        usage = max(0.0, end - start)
        cost = usage * rate
        total += cost
        
        doc.paragraph(
            f"• {label}: Stan początkowy: {start:g} {unit} | Stan końcowy: {end:g} {unit} | "
            f"Zużycie: {usage:g} {unit} | Cena: {rate:g} PLN/{unit} | Koszt: <b>{cost:.2f} PLN</b>"
        )

    doc.spacer(3)
    doc.section("2. PODSUMOWANIE ROZLICZENIA")
    doc.paragraph(f"Oświadczenie: Strony potwierdzają prawidłowość powyższych odczytów liczników oraz kosztów zużycia mediów. Rozliczenie sporządzono cyfrowo w aplikacji LOKUM.PDF.")
    doc.spacer(2)
    doc.paragraph(f"SUMA DO ZAPŁATY: {total:.2f} PLN", size=8)

    _draw_signatures(doc, data, "Podpis przekazującego", "Podpis przejmującego")
    return doc.save()